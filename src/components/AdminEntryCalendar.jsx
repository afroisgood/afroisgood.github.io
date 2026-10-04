// src/components/AdminEntryCalendar.jsx
// 後台左側的推薦導覽：月曆跳月份、搜尋找藝人／專輯，取代原本三百多筆的一長串清單

import { IconChevronLeft, IconChevronRight } from './Icons';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

const pad = (n) => String(n).padStart(2, '0');
const toKey = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

const EntryRow = ({ entry, isSelected, onSelect }) => (
    <button
        onClick={() => onSelect(entry)}
        className={'w-full text-left px-4 py-3 border-b border-zinc-800/50 hover:bg-zinc-800 transition-colors ' + (isSelected ? 'bg-zinc-800 border-l-2 border-l-amber-500' : '')}
    >
        <p className="text-amber-500 text-[10px] font-mono mb-0.5">{entry.date}</p>
        <p className="text-white text-xs font-bold truncate">{entry.artist || '（未填）'}</p>
        <p className="text-zinc-500 text-[10px] truncate">{entry.album || '-'}</p>
    </button>
);

export const AdminEntryCalendar = ({
    entries,
    month,          // 該月 1 號的 Date
    onMonthChange,
    search,
    onSearchChange,
    selectedDate,
    onSelectEntry,
    onNewForDate,
}) => {
    const query = search.trim().toLowerCase();

    if (query) {
        const matches = entries
            .filter(e => [e.date, e.artist, e.album, e.song].some(v => v?.toLowerCase().includes(query)))
            .slice()
            .reverse();
        return (
            <>
                <SearchBox value={search} onChange={onSearchChange} />
                <p className="px-4 py-2 text-zinc-500 text-[10px] font-mono border-b border-zinc-800">找到 {matches.length} 筆</p>
                {matches.length === 0
                    ? <p className="text-zinc-600 text-xs text-center p-8">沒有符合的推薦</p>
                    : matches.map(entry => (
                        <EntryRow key={entry.date} entry={entry} isSelected={selectedDate === entry.date} onSelect={onSelectEntry} />
                    ))}
            </>
        );
    }

    const year = month.getFullYear();
    const m = month.getMonth();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const leadingBlanks = new Date(year, m, 1).getDay();
    const monthPrefix = `${year}-${pad(m + 1)}-`;
    const byDate = new Map(entries.filter(e => e.date.startsWith(monthPrefix)).map(e => [e.date, e]));
    const now = new Date();
    const todayKey = toKey(now.getFullYear(), now.getMonth(), now.getDate());
    const monthEntries = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));

    const shiftMonth = (delta) => onMonthChange(new Date(year, m + delta, 1));

    return (
        <>
            <SearchBox value={search} onChange={onSearchChange} />

            <div className="px-3 pt-3 pb-4 border-b border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                    <button onClick={() => shiftMonth(-1)} aria-label="上個月" className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-amber-400 transition-colors">
                        <IconChevronLeft size={16} />
                    </button>
                    <span className="text-white text-xs font-bold tracking-widest">
                        {year} 年 {m + 1} 月
                        <span className="text-zinc-500 font-mono font-normal ml-2">{byDate.size}/{daysInMonth}</span>
                    </span>
                    <button onClick={() => shiftMonth(1)} aria-label="下個月" className="w-9 h-9 flex items-center justify-center text-zinc-400 hover:text-amber-400 transition-colors">
                        <IconChevronRight size={16} />
                    </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center">
                    {WEEKDAYS.map(w => (
                        <span key={w} className="text-zinc-500 text-[10px] py-1">{w}</span>
                    ))}
                    {Array.from({ length: leadingBlanks }, (_, i) => <span key={'blank' + i} />)}
                    {Array.from({ length: daysInMonth }, (_, i) => {
                        const day = i + 1;
                        const key = toKey(year, m, day);
                        const entry = byDate.get(key);
                        const isSelected = selectedDate === key;
                        const isToday = todayKey === key;
                        return (
                            <button
                                key={key}
                                onClick={() => entry ? onSelectEntry(entry) : onNewForDate(key)}
                                title={entry ? `${entry.artist}《${entry.album}》` : '新增這天的推薦'}
                                aria-label={entry ? `${key} 編輯：${entry.artist}` : `${key} 新增推薦`}
                                className={
                                    'h-8 text-[11px] font-mono rounded-sm transition-colors ' +
                                    (entry
                                        ? 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 '
                                        : 'text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 ') +
                                    (isSelected ? 'ring-1 ring-amber-400 ' : '') +
                                    (isToday ? 'underline underline-offset-2 ' : '')
                                }
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </div>

            {monthEntries.length === 0
                ? <p className="text-zinc-600 text-xs text-center p-8 leading-relaxed">這個月還沒有推薦<br />點月曆上的日期新增</p>
                : monthEntries.map(entry => (
                    <EntryRow key={entry.date} entry={entry} isSelected={selectedDate === entry.date} onSelect={onSelectEntry} />
                ))}
        </>
    );
};

const SearchBox = ({ value, onChange }) => (
    <div className="px-3 pt-3 sticky top-0 bg-zinc-900 z-10 pb-2 border-b border-zinc-800">
        <label className="sr-only" htmlFor="admin-entry-search">搜尋推薦</label>
        <input
            id="admin-entry-search"
            type="search"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder="搜尋日期、藝人、專輯…"
            className="w-full bg-zinc-800 border border-zinc-700 text-white text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-amber-500 placeholder:text-zinc-500"
        />
    </div>
);
