// src/components/AdminPanel.jsx
import { useState } from 'react';
import { IconDisc } from './Icons';

const OWNER = 'afroisgood';
const REPO = 'afroisgood.github.io';
const FILE_PATH = 'public/data.json';

const EMPTY_ENTRY = {
    date: '',
    song: '',
    artist: '',
    album: '',
    youtube: '',
    spotify: '',
    appleMusic: '',
    other: '',
    imageUrl: '',
    quote: '',
    content: '',
    editorNote: '',
    mood: '',
};

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
    const [token, setToken] = useState(sessionStorage.getItem('gh_admin_token') || '');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [entries, setEntries] = useState([]);
    const [fileSha, setFileSha] = useState('');
    const [selectedEntry, setSelectedEntry] = useState(null);
    const [form, setForm] = useState(EMPTY_ENTRY);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const apiHeaders = {
        Authorization: 'token ' + token,
        'Content-Type': 'application/json',
    };

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
            setEntries(Array.isArray(data) ? data.sort((a, b) => a.date.localeCompare(b.date)) : []);
            setIsLoggedIn(true);
            sessionStorage.setItem('gh_admin_token', token);
        } catch (e) {
            setError(e.message);
        }
        setIsLoading(false);
    };

    const saveData = async (newEntries) => {
        setIsSaving(true);
        setMessage('');
        setError('');
        try {
            const sorted = [...newEntries].sort((a, b) => a.date.localeCompare(b.date));
            const jsonStr = JSON.stringify(sorted, null, 2);
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
            setEntries(sorted);
            setMessage('儲存成功！網站約 2 分鐘後自動更新。');
            setSelectedEntry(null);
            setForm(EMPTY_ENTRY);
        } catch (e) {
            setError(e.message);
        }
        setIsSaving(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.date || !form.artist) {
            setError('日期與藝人名稱為必填');
            return;
        }
        const exists = entries.find(entry => entry.date === form.date);
        const newEntries = exists
            ? entries.map(entry => entry.date === form.date ? form : entry)
            : [...entries, form];
        saveData(newEntries);
    };

    const handleDelete = (date) => {
        if (!window.confirm('確定要刪除 ' + date + ' 的資料嗎？')) return;
        saveData(entries.filter(e => e.date !== date));
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

    const handleLogout = () => {
        sessionStorage.removeItem('gh_admin_token');
        setIsLoggedIn(false);
        setToken('');
        setEntries([]);
    };

    const setField = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }));

    // ── 登入畫面 ──────────────────────────────────────────
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="flex items-center gap-3 mb-2 justify-center">
                        <IconDisc className="text-amber-500" size={24} />
                        <h1 className="text-white font-playfair font-bold text-xl tracking-widest">JAZZ 365</h1>
                    </div>
                    <p className="text-zinc-500 text-[10px] tracking-[0.3em] uppercase text-center mb-10">Admin Panel</p>

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
                    <span className="text-zinc-600 text-[10px] font-mono ml-2">{entries.length} 筆資料</span>
                </div>
                <div className="flex items-center gap-6">
                    <a href="/" className="text-zinc-400 hover:text-amber-400 text-[10px] tracking-widest uppercase transition-colors">
                        回網站
                    </a>
                    <button onClick={handleLogout} className="text-zinc-500 hover:text-red-400 text-[10px] tracking-widest uppercase transition-colors">
                        登出
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 61px)' }}>

                {/* 左側：資料列表 */}
                <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col flex-shrink-0">
                    <div className="p-4 border-b border-zinc-800">
                        <button
                            onClick={handleNew}
                            className="w-full bg-amber-500 text-zinc-950 font-black text-[10px] tracking-[0.2em] uppercase py-2.5 rounded-sm hover:bg-amber-400 transition-colors"
                        >
                            + 新增推薦
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {entries.length === 0 ? (
                            <p className="text-zinc-600 text-xs text-center p-8 leading-relaxed">
                                尚無資料<br />點擊新增推薦開始吧
                            </p>
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
                        )}
                    </div>
                </aside>

                {/* 右側：編輯表單 */}
                <main className="flex-1 overflow-y-auto p-8">
                    {message && (
                        <div className="mb-6 bg-green-900/30 border border-green-700/50 text-green-400 text-xs px-4 py-3 rounded-sm">
                            {message}
                        </div>
                    )}
                    {error && (
                        <div className="mb-6 bg-red-900/30 border border-red-700/50 text-red-400 text-xs px-4 py-3 rounded-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="max-w-2xl">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-white font-playfair font-bold text-lg tracking-widest">
                                {selectedEntry ? '編輯推薦' : '新增推薦'}
                            </h2>
                            {selectedEntry && (
                                <button
                                    type="button"
                                    onClick={() => handleDelete(selectedEntry.date)}
                                    className="text-red-500 hover:text-red-400 text-[10px] tracking-widest uppercase transition-colors"
                                >
                                    刪除此筆
                                </button>
                            )}
                        </div>

                        {/* 基本資訊 */}
                        <div className="grid grid-cols-2 gap-4 mb-5">
                            <Field label="日期 *">
                                <input type="date" value={form.date} onChange={setField('date')} required className={inputCls} />
                            </Field>
                            <Field label="情境背景色 Mood">
                                <input type="text" value={form.mood} onChange={setField('mood')} placeholder="#FECACA 或留空" className={inputCls} />
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

                        {/* 串流連結 */}
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

                        <button
                            type="submit"
                            disabled={isSaving}
                            className="w-full bg-amber-500 text-zinc-950 font-black text-[11px] tracking-[0.2em] uppercase py-4 rounded-sm hover:bg-amber-400 transition-colors disabled:opacity-50"
                        >
                            {isSaving ? '儲存中...' : '儲存並發布'}
                        </button>

                        <p className="text-zinc-600 text-[10px] text-center mt-3">
                            儲存後 GitHub 會自動重新部署，約 2 分鐘生效
                        </p>
                    </form>
                </main>
            </div>
        </div>
    );
};
