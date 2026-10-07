// src/components/AdminPanel.jsx
import { useState, useRef } from 'react';
import { IconDisc } from './Icons';
import { AdminEntryCalendar } from './AdminEntryCalendar';
import { MOOD_OPTIONS, DEFAULT_MOOD_COLOR } from '../utils/moodColors';

const OWNER    = 'afroisgood';
const REPO     = 'afroisgood.github.io';
const FILE_PATH = 'public/data.json';

// 拍照辨識代理服務網址（部署 admin-worker 後填進 .env.local 的 VITE_ADMIN_WORKER_URL）
const RECOGNIZE_WORKER_URL = import.meta.env.VITE_ADMIN_WORKER_URL || '';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

// Apple Music／專輯封面查詢：直接從瀏覽器呼叫 iTunes Search API（免金鑰、支援 CORS）。
// 特意不透過 admin-worker 代理 —— Cloudflare Worker 的對外 IP 是跟其他用戶共用的資料中心 IP，
// 常被 Apple 判定為異常流量而擋掉；瀏覽器端的一般使用者 IP 沒有這個問題。
const searchAppleMusic = async (artist, album) => {
    const query = [artist, album].filter(Boolean).join(' ').trim();
    if (!query) return { appleMusic: '', imageUrl: '' };

    const url = new URL('https://itunes.apple.com/search');
    url.searchParams.set('term', query);
    url.searchParams.set('entity', 'album');
    url.searchParams.set('limit', '1');

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Apple Music 搜尋失敗（${res.status}）`);
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return { appleMusic: '', imageUrl: '' };

    // artworkUrl100 是 100x100 縮圖，換成較大尺寸當作專輯封面
    const imageUrl = result.artworkUrl100 ? result.artworkUrl100.replace('100x100', '600x600') : '';
    return { appleMusic: result.collectionViewUrl || '', imageUrl };
};

const EMPTY_ENTRY = {
    date: '', song: '', artist: '', album: '', youtube: '',
    spotify: '', appleMusic: '', other: '', imageUrl: '',
    quote: '', content: '', editorNote: '', albumNotes: '', mood: '',
};

const EMPTY_CL = { version: '', date: '', content: '' };

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2.5 rounded-sm font-tc focus:outline-none focus:border-amber-500 placeholder:text-zinc-600';

const Field = ({ label, children, cls, flagged }) => (
    <div className={cls}>
        <label className="flex items-center gap-2 text-zinc-400 text-[10px] tracking-[0.2em] uppercase font-bold mb-2">
            {label}
            {flagged && (
                <span className="text-amber-500 normal-case tracking-normal font-bold">
                    ✦ AI 辨識，請確認
                </span>
            )}
        </label>
        {children}
    </div>
);

export const AdminPanel = () => {
    const [token, setToken]               = useState(sessionStorage.getItem('gh_admin_token') || '');
    const [isLoggedIn, setIsLoggedIn]     = useState(false);
    const [entries, setEntries]           = useState([]);
    const [changelog, setChangelog]       = useState([]);
    const [fileSha, setFileSha]           = useState('');
    const [activeTab, setActiveTab]       = useState('entries');   // 'entries' | 'changelog' | 'traffic'

    // Traffic state
    const [traffic, setTraffic]           = useState(null);
    const [trafficLoading, setTrafficLoading] = useState(false);
    const [trafficError, setTrafficError] = useState('');

    // Jazz entry state
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [form, setForm]                   = useState(EMPTY_ENTRY);
    const [calMonth, setCalMonth]           = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
    const [entrySearch, setEntrySearch]     = useState('');

    // 拍照辨識狀態
    const [recognizing, setRecognizing]         = useState(false);
    const [recognizeError, setRecognizeError]   = useState('');
    const [recognizedFields, setRecognizedFields] = useState([]);
    const photoInputRef = useRef(null);

    // Changelog state
    const [selectedCl, setSelectedCl] = useState(null);
    const [clForm, setClForm]         = useState(EMPTY_CL);

    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage]   = useState('');
    const [error, setError]       = useState('');

    const apiHeaders = {
        Authorization: 'token ' + token,
        'Content-Type': 'application/json',
    };

    // ── 讀取資料 ──────────────────────────────────────────
    const loadData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const res = await fetch(
                'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + FILE_PATH,
                { headers: apiHeaders }
            );
            if (!res.ok) throw new Error(res.status === 401 ? '認證失敗，請確認 Token 是否正確' : '讀取資料失敗');
            const json = await res.json();
            setFileSha(json.sha);
            const decoded = decodeURIComponent(escape(atob(json.content.replace(/\n/g, ''))));
            const data = JSON.parse(decoded);
            // 相容舊格式（純陣列）和新格式 { entries, changelog }
            const loadedEntries  = Array.isArray(data) ? data : (data.entries   || []);
            const loadedChangelog = Array.isArray(data) ? []   : (data.changelog || []);
            setEntries(loadedEntries.slice().sort((a, b) => a.date.localeCompare(b.date)));
            setChangelog(loadedChangelog.slice().sort((a, b) => b.date.localeCompare(a.date)));
            setIsLoggedIn(true);
            sessionStorage.setItem('gh_admin_token', token);
        } catch (e) {
            setError(e.message);
        }
        setIsLoading(false);
    };

    // ── 統一儲存（jazz entries + changelog 一起寫入） ────
    const saveAll = async (newEntries, newChangelog) => {
        setIsSaving(true);
        setMessage('');
        setError('');
        try {
            const sortedEntries   = [...newEntries].sort((a, b) => a.date.localeCompare(b.date));
            const sortedChangelog = [...newChangelog].sort((a, b) => b.date.localeCompare(a.date));
            const payload = { entries: sortedEntries, changelog: sortedChangelog };
            const jsonStr = JSON.stringify(payload, null, 2);
            const content = btoa(unescape(encodeURIComponent(jsonStr)));
            const res = await fetch(
                'https://api.github.com/repos/' + OWNER + '/' + REPO + '/contents/' + FILE_PATH,
                {
                    method: 'PUT',
                    headers: apiHeaders,
                    body: JSON.stringify({
                        message: 'Update jazz data: ' + new Date().toISOString().slice(0, 10),
                        content,
                        sha: fileSha,
                    }),
                }
            );
            if (!res.ok) throw new Error('儲存失敗，請再試一次');
            const json = await res.json();
            setFileSha(json.content.sha);
            setEntries(sortedEntries);
            setChangelog(sortedChangelog);
            setMessage('儲存成功！網站約 2 分鐘後自動更新。');
            setSelectedEntry(null);
            setForm(EMPTY_ENTRY);
            setRecognizedFields([]);
            setSelectedCl(null);
            setClForm(EMPTY_CL);
        } catch (e) {
            setError(e.message);
        }
        setIsSaving(false);
    };

    // ── Jazz entry handlers ───────────────────────────────
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.date || !form.artist) { setError('日期與藝人名稱為必填'); return; }
        const exists    = entries.find(entry => entry.date === form.date);
        const newEntries = exists
            ? entries.map(entry => entry.date === form.date ? form : entry)
            : [...entries, form];
        saveAll(newEntries, changelog);
    };

    const handleDelete = (date) => {
        if (!window.confirm('確定要刪除 ' + date + ' 的資料嗎？')) return;
        saveAll(entries.filter(e => e.date !== date), changelog);
    };

    const handleEdit = (entry) => {
        const [y, m] = entry.date.split('-').map(Number);
        setCalMonth(new Date(y, m - 1, 1));
        setSelectedEntry(entry);
        setForm({ ...EMPTY_ENTRY, ...entry });
        setRecognizedFields([]);
        setRecognizeError('');
        setError('');
        setMessage('');
    };

    const handleNew = (date = '') => {
        setSelectedEntry(null);
        setForm({ ...EMPTY_ENTRY, date });
        setRecognizedFields([]);
        setRecognizeError('');
        setError('');
        setMessage('');
    };

    const setField = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    // ── 拍照辨識 ───────────────────────────────────────────
    const handlePhotoSelected = async (e) => {
        const file = e.target.files?.[0];
        e.target.value = ''; // 允許重複選同一張照片
        if (!file) return;

        if (!RECOGNIZE_WORKER_URL) {
            setRecognizeError('尚未設定辨識服務網址（請部署 admin-worker 並設定 VITE_ADMIN_WORKER_URL）');
            return;
        }

        setRecognizing(true);
        setRecognizeError('');
        try {
            const dataUrl = await fileToBase64(file);
            const res = await fetch(RECOGNIZE_WORKER_URL + '/recognize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: 'token ' + token,
                },
                body: JSON.stringify({ image: dataUrl, mimeType: file.type }),
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.error || '辨識失敗，請再試一次');

            const { warnings = [], ...recognized } = result;

            // Apple Music／封面圖從瀏覽器端另外查，不透過 Worker（見上方 searchAppleMusic 註解）
            try {
                const appleResult = await searchAppleMusic(recognized.artist, recognized.album);
                Object.assign(recognized, appleResult);
            } catch (err) {
                warnings.push(err.message);
            }

            setForm(prev => ({ ...prev, ...recognized }));
            setRecognizedFields(Object.keys(recognized).filter(k => recognized[k]));
            if (warnings.length) setRecognizeError(warnings.join('；'));
        } catch (err) {
            setRecognizeError(err.message);
        }
        setRecognizing(false);
    };

    // ── Changelog handlers ────────────────────────────────
    const handleClSubmit = (e) => {
        e.preventDefault();
        if (!clForm.version || !clForm.date) { setError('版本號與日期為必填'); return; }
        const exists  = changelog.find(c => c.version === clForm.version);
        const newCl   = exists
            ? changelog.map(c => c.version === clForm.version ? clForm : c)
            : [...changelog, clForm];
        saveAll(entries, newCl);
    };

    const handleClDelete = (version) => {
        if (!window.confirm('確定要刪除 ' + version + ' 嗎？')) return;
        saveAll(entries, changelog.filter(c => c.version !== version));
    };

    const handleClEdit = (cl) => {
        setSelectedCl(cl);
        setClForm({ ...cl });
        setError('');
        setMessage('');
    };

    const handleClNew = () => {
        setSelectedCl(null);
        setClForm(EMPTY_CL);
        setError('');
        setMessage('');
    };

    // ── 讀取流量資料 ─────────────────────────────────────
    const loadTraffic = async () => {
        setTrafficLoading(true);
        setTrafficError('');
        try {
            const res = await fetch(
                'https://api.github.com/repos/' + OWNER + '/' + REPO + '/traffic/views',
                { headers: apiHeaders }
            );
            if (!res.ok) throw new Error(res.status === 403 ? '權限不足，Token 需有 repo 範圍' : '讀取流量失敗');
            const data = await res.json();
            setTraffic(data);
        } catch (e) {
            setTrafficError(e.message);
        }
        setTrafficLoading(false);
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'traffic' && !traffic && !trafficLoading) loadTraffic();
    };

    const handleLogout = () => {
        sessionStorage.removeItem('gh_admin_token');
        setIsLoggedIn(false);
        setToken('');
        setEntries([]);
        setChangelog([]);
    };

    // ── 登入畫面 ──────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-3 mb-2 justify-center">
                        <IconDisc className="text-amber-500" size={24} />
                        <h1 className="text-white font-playfair font-bold text-xl tracking-widest">JAZZ 365</h1>
                    </div>
                    <p className="text-zinc-500 text-[10px] tracking-[0.3em] uppercase text-center mb-10">後台管理</p>

                    <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-8">
                        <h2 className="text-white font-bold text-sm tracking-widest uppercase mb-1">登入後台</h2>
                        <p className="text-zinc-500 text-xs mb-6 leading-relaxed">
                            請輸入你的 GitHub Personal Access Token（需有 repo 寫入權限）
                        </p>
                        <input
                            type="password"
                            value={token}
                            onChange={e => setToken(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && loadData()}
                            placeholder="ghp_xxxxxxxxxxxx"
                            className="w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-4 py-3 rounded-sm mb-4 font-mono focus:outline-none focus:border-amber-500"
                        />
                        {error && <p className="text-red-400 text-xs mb-4">{error}</p>}
                        <button
                            onClick={loadData}
                            disabled={isLoading || !token}
                            className="w-full bg-amber-500 text-zinc-950 font-black text-[11px] tracking-[0.2em] uppercase py-3 rounded-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
                        >
                            {isLoading ? '驗證中...' : '進入後台'}
                        </button>
                        <div className="mt-6 pt-6 border-t border-zinc-800">
                            <p className="text-zinc-600 text-[10px] leading-relaxed">
                                尚未建立 Token？前往 GitHub Settings → Developer settings → Personal access tokens → Generate new token，勾選 <span className="text-zinc-400 font-mono">repo</span> 權限即可。
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── 主後台畫面 ────────────────────────────────────────
    return (
        <div className="min-h-screen bg-zinc-950 flex flex-col">

            {/* 頂部導覽列 */}
            <header className="bg-zinc-900 border-b border-zinc-800 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <IconDisc className="text-amber-500" size={20} />
                    <span className="text-white font-playfair font-bold tracking-widest text-sm">JAZZ 365 ADMIN</span>
                    <span className="text-zinc-600 text-[10px] font-mono ml-2">{entries.length} 筆推薦</span>
                </div>
                <div className="flex items-center gap-6">
                    <a href="/" className="text-zinc-400 hover:text-amber-400 text-[10px] tracking-widest uppercase transition-colors">回網站</a>
                    <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 text-[10px] tracking-widest uppercase transition-colors">登出</button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 61px)' }}>

                {/* ── 左側：列表 ── */}
                <aside className="w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col flex-shrink-0">

                    {/* Tab 切換 */}
                    <div className="flex border-b border-zinc-800 flex-shrink-0">
                        <button
                            onClick={() => handleTabChange('entries')}
                            className={'flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-colors ' + (activeTab === 'entries' ? 'text-amber-500 border-b-2 border-amber-500 bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300')}
                        >
                            日期推薦
                        </button>
                        <button
                            onClick={() => handleTabChange('changelog')}
                            className={'flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-colors ' + (activeTab === 'changelog' ? 'text-amber-500 border-b-2 border-amber-500 bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300')}
                        >
                            更新紀錄
                        </button>
                        <button
                            onClick={() => handleTabChange('traffic')}
                            className={'flex-1 py-3 text-[10px] font-bold tracking-widest uppercase transition-colors ' + (activeTab === 'traffic' ? 'text-amber-500 border-b-2 border-amber-500 bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300')}
                        >
                            流量
                        </button>
                    </div>

                    {/* 新增按鈕 */}
                    <div className="p-4 border-b border-zinc-800 flex-shrink-0">
                        {activeTab === 'entries' && (
                            <button onClick={() => handleNew()} className="w-full bg-amber-500 text-zinc-950 font-black text-[10px] tracking-[0.2em] uppercase py-2.5 rounded-sm hover:bg-amber-400 transition-colors">
                                + 新增推薦
                            </button>
                        )}
                        {activeTab === 'changelog' && (
                            <button onClick={handleClNew} className="w-full bg-amber-500 text-zinc-950 font-black text-[10px] tracking-[0.2em] uppercase py-2.5 rounded-sm hover:bg-amber-400 transition-colors">
                                + 新增版本紀錄
                            </button>
                        )}
                        {activeTab === 'traffic' && (
                            <button onClick={loadTraffic} disabled={trafficLoading} className="w-full bg-zinc-700 text-zinc-300 font-black text-[10px] tracking-[0.2em] uppercase py-2.5 rounded-sm hover:bg-zinc-600 transition-colors disabled:opacity-50">
                                {trafficLoading ? '讀取中...' : '↻ 重新整理'}
                            </button>
                        )}
                    </div>

                    {/* 列表 */}
                    <div className="flex-1 overflow-y-auto">
                        {activeTab === 'entries' ? (
                            <AdminEntryCalendar
                                entries={entries}
                                month={calMonth}
                                onMonthChange={setCalMonth}
                                search={entrySearch}
                                onSearchChange={setEntrySearch}
                                selectedDate={selectedEntry?.date ?? form.date}
                                onSelectEntry={handleEdit}
                                onNewForDate={handleNew}
                            />
                        ) : (
                            changelog.length === 0 ? (
                                <p className="text-zinc-600 text-xs text-center p-8 leading-relaxed">尚無更新紀錄<br />點擊上方按鈕新增</p>
                            ) : (
                                changelog.map(cl => (
                                    <button
                                        key={cl.version}
                                        onClick={() => handleClEdit(cl)}
                                        className={'w-full text-left px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors ' + (selectedCl?.version === cl.version ? 'bg-zinc-800 border-l-2 border-l-amber-500' : '')}
                                    >
                                        <p className="text-amber-500 text-[10px] font-mono mb-0.5">{cl.version}</p>
                                        <p className="text-zinc-400 text-[10px]">{cl.date}</p>
                                        <p className="text-zinc-500 text-[10px] truncate mt-0.5">{cl.content?.split('\n')[0]}</p>
                                    </button>
                                ))
                            )
                        )}
                    </div>
                </aside>

                {/* ── 右側：表單 ── */}
                <main className="flex-1 overflow-y-auto p-8">
                    {message && (
                        <div className="mb-6 bg-green-900/30 border border-green-700/50 text-green-400 text-xs px-4 py-3 rounded-sm">{message}</div>
                    )}
                    {error && (
                        <div className="mb-6 bg-red-900/30 border border-red-700/50 text-red-400 text-xs px-4 py-3 rounded-sm">{error}</div>
                    )}

                    {/* ── Jazz 推薦表單 ── */}
                    {activeTab === 'entries' && (
                        <form onSubmit={handleSubmit} className="max-w-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-white font-playfair font-bold text-lg tracking-widest">
                                    {selectedEntry ? '編輯推薦' : '新增推薦'}
                                </h2>
                                {selectedEntry && (
                                    <button type="button" onClick={() => handleDelete(selectedEntry.date)} className="text-red-500 hover:text-red-400 text-[10px] tracking-widest uppercase transition-colors">
                                        刪除此筆
                                    </button>
                                )}
                            </div>

                            <div className="mb-6">
                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    ref={photoInputRef}
                                    onChange={handlePhotoSelected}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={() => photoInputRef.current?.click()}
                                    disabled={recognizing}
                                    className="w-full bg-zinc-800 border border-dashed border-zinc-600 text-zinc-300 font-bold text-[11px] tracking-[0.2em] uppercase py-3 rounded-sm hover:border-amber-500 hover:text-amber-400 transition-colors disabled:opacity-50"
                                >
                                    {recognizing ? '辨識中...' : '📷 拍照辨識並自動填表'}
                                </button>
                                {recognizeError && (
                                    <p className="text-amber-500 text-[10px] mt-2 leading-relaxed">{recognizeError}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <Field label="日期 *" flagged={recognizedFields.includes('date')}>
                                    <input type="date" value={form.date} onChange={setField('date')} required className={inputCls} />
                                </Field>
                                <Field label="情境背景色 Mood">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-9 rounded-sm border border-zinc-600 flex-shrink-0" style={{ backgroundColor: MOOD_OPTIONS.find(o => o.value === form.mood)?.color || DEFAULT_MOOD_COLOR }} />
                                        <select value={form.mood} onChange={setField('mood')} className={inputCls}>
                                            {MOOD_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <Field label="藝人名稱 *" flagged={recognizedFields.includes('artist')}>
                                    <input type="text" value={form.artist} onChange={setField('artist')} placeholder="Miles Davis" required className={inputCls} />
                                </Field>
                                <Field label="曲名" flagged={recognizedFields.includes('song')}>
                                    <input type="text" value={form.song} onChange={setField('song')} placeholder="So What" className={inputCls} />
                                </Field>
                            </div>

                            <Field label="專輯名稱" cls="mb-5" flagged={recognizedFields.includes('album')}>
                                <input type="text" value={form.album} onChange={setField('album')} placeholder="Kind of Blue" className={inputCls} />
                            </Field>
                            <Field label="引言 Quote" cls="mb-5" flagged={recognizedFields.includes('quote')}>
                                <input type="text" value={form.quote} onChange={setField('quote')} placeholder="一句讓人印象深刻的句子..." className={inputCls} />
                            </Field>
                            <Field label="內容介紹" cls="mb-5" flagged={recognizedFields.includes('content')}>
                                <textarea value={form.content} onChange={setField('content')} rows={6} placeholder="關於這張專輯的介紹文字..." className={inputCls + ' resize-none'} />
                            </Field>
                            <Field label="編輯備注 Editor Note" cls="mb-5">
                                <input type="text" value={form.editorNote} onChange={setField('editorNote')} placeholder="選填：編輯補充說明" className={inputCls} />
                            </Field>
                            <Field label="專輯資訊補充（前台顯示）" cls="mb-5">
                                <textarea value={form.albumNotes} onChange={setField('albumNotes')} rows={4} placeholder="選填：發行年份、廠牌、樂手、錄音背景等自己查到的資訊" className={inputCls + ' resize-y'} />
                            </Field>
                            <Field label="專輯封面圖片 URL" cls="mb-5" flagged={recognizedFields.includes('imageUrl')}>
                                <input type="url" value={form.imageUrl} onChange={setField('imageUrl')} placeholder="https://i.imgur.com/..." className={inputCls} />
                            </Field>

                            <div className="border-t border-zinc-800 pt-6 mb-6">
                                <p className="text-zinc-500 text-[10px] tracking-[0.3em] uppercase font-bold mb-4">串流連結</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="YouTube" flagged={recognizedFields.includes('youtube')}>
                                        <input type="url" value={form.youtube} onChange={setField('youtube')} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
                                    </Field>
                                    <Field label="Spotify" flagged={recognizedFields.includes('spotify')}>
                                        <input type="url" value={form.spotify} onChange={setField('spotify')} placeholder="https://open.spotify.com/..." className={inputCls} />
                                    </Field>
                                    <Field label="Apple Music" flagged={recognizedFields.includes('appleMusic')}>
                                        <input type="url" value={form.appleMusic} onChange={setField('appleMusic')} placeholder="https://music.apple.com/..." className={inputCls} />
                                    </Field>
                                    <Field label="其他連結">
                                        <input type="url" value={form.other} onChange={setField('other')} placeholder="https://..." className={inputCls} />
                                    </Field>
                                </div>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full bg-amber-500 text-zinc-950 font-black text-[11px] tracking-[0.2em] uppercase py-4 rounded-sm hover:bg-amber-400 transition-colors disabled:opacity-50">
                                {isSaving ? '儲存中...' : '儲存並發布'}
                            </button>
                            <p className="text-zinc-600 text-[10px] text-center mt-3">儲存後 GitHub 會自動重新部署，約 2 分鐘生效</p>
                        </form>
                    )}

                    {/* ── 更新紀錄表單 ── */}
                    {activeTab === 'changelog' && (
                        <form onSubmit={handleClSubmit} className="max-w-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-white font-playfair font-bold text-lg tracking-widest">
                                    {selectedCl ? '編輯版本紀錄' : '新增版本紀錄'}
                                </h2>
                                {selectedCl && (
                                    <button type="button" onClick={() => handleClDelete(selectedCl.version)} className="text-red-500 hover:text-red-400 text-[10px] tracking-widest uppercase transition-colors">
                                        刪除此版本
                                    </button>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <Field label="版本號 *">
                                    <input
                                        type="text"
                                        value={clForm.version}
                                        onChange={e => setClForm(p => ({ ...p, version: e.target.value }))}
                                        placeholder="v1.4.0"
                                        required
                                        className={inputCls}
                                    />
                                </Field>
                                <Field label="發布日期 *">
                                    <input
                                        type="date"
                                        value={clForm.date}
                                        onChange={e => setClForm(p => ({ ...p, date: e.target.value }))}
                                        required
                                        className={inputCls}
                                    />
                                </Field>
                            </div>

                            <Field label="更新內容（每行一項）" cls="mb-6">
                                <textarea
                                    value={clForm.content}
                                    onChange={e => setClForm(p => ({ ...p, content: e.target.value }))}
                                    rows={5}
                                    placeholder={'新功能上線。\n修復某某問題。\n介面優化。'}
                                    className={inputCls + ' resize-none'}
                                />
                            </Field>

                            <button type="submit" disabled={isSaving} className="w-full bg-amber-500 text-zinc-950 font-black text-[11px] tracking-[0.2em] uppercase py-4 rounded-sm hover:bg-amber-400 transition-colors disabled:opacity-50">
                                {isSaving ? '儲存中...' : '儲存版本紀錄'}
                            </button>
                            <p className="text-zinc-600 text-[10px] text-center mt-3">儲存後約 2 分鐘自動更新至網站前台</p>
                        </form>
                    )}
                    {/* ── 流量統計 ── */}
                    {activeTab === 'traffic' && (
                        <div className="max-w-2xl">
                            <div className="flex items-center justify-between mb-8">
                                <h2 className="text-white font-playfair font-bold text-lg tracking-widest">每日瀏覽人次</h2>
                                <span className="text-zinc-600 text-[10px] font-mono">近 14 天・由 GitHub 提供</span>
                            </div>

                            {trafficError && (
                                <div className="mb-6 bg-red-900/30 border border-red-700/50 text-red-400 text-xs px-4 py-3 rounded-sm">{trafficError}</div>
                            )}

                            {trafficLoading && (
                                <div className="text-zinc-500 text-sm text-center py-20">讀取中...</div>
                            )}

                            {traffic && !trafficLoading && (() => {
                                const views = [...(traffic.views || [])].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
                                const maxCount = Math.max(...views.map(v => v.count), 1);
                                return (
                                    <>
                                        {/* 總計卡片 */}
                                        <div className="grid grid-cols-2 gap-4 mb-8">
                                            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-5">
                                                <p className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase font-bold mb-1">14 天總瀏覽</p>
                                                <p className="text-amber-400 font-playfair font-bold text-3xl">{traffic.count?.toLocaleString() ?? '—'}</p>
                                                <p className="text-zinc-600 text-[10px] mt-1">次瀏覽</p>
                                            </div>
                                            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-5">
                                                <p className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase font-bold mb-1">不重複訪客</p>
                                                <p className="text-white font-playfair font-bold text-3xl">{traffic.uniques?.toLocaleString() ?? '—'}</p>
                                                <p className="text-zinc-600 text-[10px] mt-1">不重複訪客</p>
                                            </div>
                                        </div>

                                        {/* 每日長條圖 */}
                                        {views.length === 0 ? (
                                            <p className="text-zinc-600 text-xs text-center py-10">近期尚無瀏覽紀錄</p>
                                        ) : (
                                            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-6">
                                                <p className="text-zinc-500 text-[10px] tracking-[0.2em] uppercase font-bold mb-5">每日明細</p>
                                                <div className="space-y-3">
                                                    {views.slice().reverse().map(v => {
                                                        const date = v.timestamp.slice(0, 10);
                                                        const barPct = Math.round((v.count / maxCount) * 100);
                                                        return (
                                                            <div key={date} className="flex items-center gap-3">
                                                                <span className="text-zinc-500 text-[10px] font-mono w-20 flex-shrink-0">{date}</span>
                                                                <div className="flex-1 h-5 bg-zinc-800 rounded-sm overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-amber-500/70 rounded-sm transition-all"
                                                                        style={{ width: barPct + '%' }}
                                                                    />
                                                                </div>
                                                                <span className="text-amber-400 text-[10px] font-mono w-8 text-right flex-shrink-0">{v.count}</span>
                                                                <span className="text-zinc-600 text-[10px] font-mono w-16 flex-shrink-0">({v.uniques} 人)</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};
