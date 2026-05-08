// src/components/AdminPanel.jsx
import { useState } from 'react';
import { IconDisc } from './Icons';
import { MOOD_OPTIONS } from '../utils/moodColors';

const OWNER    = 'afroisgood';
const REPO     = 'afroisgood.github.io';
const FILE_PATH = 'public/data.json';

const EMPTY_ENTRY = {
    date: '', song: '', artist: '', album: '', youtube: '',
    spotify: '', appleMusic: '', other: '', imageUrl: '',
    quote: '', content: '', editorNote: '', mood: '',
};

const EMPTY_CL = { version: '', date: '', content: '' };

const inputCls = 'w-full bg-zinc-800 border border-zinc-700 text-white text-sm px-3 py-2.5 rounded-sm font-zen focus:outline-none focus:border-amber-500 placeholder:text-zinc-600';

const Field = ({ label, children, cls }) => (
    <div className={cls}>
        <label className="block text-zinc-400 text-[10px] tracking-[0.2em] uppercase font-bold mb-2">
            {label}
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
        setSelectedEntry(entry);
        setForm({ ...EMPTY_ENTRY, ...entry });
        setError('');
        setMessage('');
    };

    const handleNew = () => {
        setSelectedEntry(null);
        setForm(EMPTY_ENTRY);
        setError('');
        setMessage('');
    };

    const setField = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

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
                <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col flex-shrink-0">

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
                            <button onClick={handleNew} className="w-full bg-amber-500 text-zinc-950 font-black text-[10px] tracking-[0.2em] uppercase py-2.5 rounded-sm hover:bg-amber-400 transition-colors">
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
                            entries.length === 0 ? (
                                <p className="text-zinc-600 text-xs text-center p-8 leading-relaxed">尚無資料<br />點擊新增推薦開始吧</p>
                            ) : (
                                entries.slice().reverse().map(entry => (
                                    <button
                                        key={entry.date}
                                        onClick={() => handleEdit(entry)}
                                        className={'w-full text-left px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors ' + (selectedEntry?.date === entry.date ? 'bg-zinc-800 border-l-2 border-l-amber-500' : '')}
                                    >
                                        <p className="text-amber-500 text-[10px] font-mono mb-0.5">{entry.date}</p>
                                        <p className="text-white text-xs font-bold truncate">{entry.artist || '（未填）'}</p>
                                        <p className="text-zinc-500 text-[10px] truncate">{entry.album || '-'}</p>
                                    </button>
                                ))
                            )
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

                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <Field label="日期 *">
                                    <input type="date" value={form.date} onChange={setField('date')} required className={inputCls} />
                                </Field>
                                <Field label="情境背景色 Mood">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-9 rounded-sm border border-zinc-600 flex-shrink-0" style={{ backgroundColor: MOOD_OPTIONS.find(o => o.value === form.mood)?.color || '#f2f0e9' }} />
                                        <select value={form.mood} onChange={setField('mood')} className={inputCls}>
                                            {MOOD_OPTIONS.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </Field>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-5">
                                <Field label="藝人名稱 *">
                                    <input type="text" value={form.artist} onChange={setField('artist')} placeholder="Miles Davis" required className={inputCls} />
                                </Field>
                                <Field label="曲名">
                                    <input type="text" value={form.song} onChange={setField('song')} placeholder="So What" className={inputCls} />
                                </Field>
                            </div>

                            <Field label="專輯名稱" cls="mb-5">
                                <input type="text" value={form.album} onChange={setField('album')} placeholder="Kind of Blue" className={inputCls} />
                            </Field>
                            <Field label="引言 Quote" cls="mb-5">
                                <input type="text" value={form.quote} onChange={setField('quote')} placeholder="一句讓人印象深刻的句子..." className={inputCls} />
                            </Field>
                            <Field label="內容介紹" cls="mb-5">
                                <textarea value={form.content} onChange={setField('content')} rows={6} placeholder="關於這張專輯的介紹文字..." className={inputCls + ' resize-none'} />
                            </Field>
                            <Field label="編輯備注 Editor Note" cls="mb-5">
                                <input type="text" value={form.editorNote} onChange={setField('editorNote')} placeholder="選填：編輯補充說明" className={inputCls} />
                            </Field>
                            <Field label="專輯封面圖片 URL" cls="mb-5">
                                <input type="url" value={form.imageUrl} onChange={setField('imageUrl')} placeholder="https://i.imgur.com/..." className={inputCls} />
                            </Field>

                            <div className="border-t border-zinc-800 pt-6 mb-6">
                                <p className="text-zinc-500 text-[10px] tracking-[0.3em] uppercase font-bold mb-4">串流連結</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <Field label="YouTube">
                                        <input type="url" value={form.youtube} onChange={setField('youtube')} placeholder="https://youtube.com/watch?v=..." className={inputCls} />
                                    </Field>
                                    <Field label="Spotify">
                                        <input type="url" value={form.spotify} onChange={setField('spotify')} placeholder="https://open.spotify.com/..." className={inputCls} />
                                    </Field>
                                    <Field label="Apple Music">
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
