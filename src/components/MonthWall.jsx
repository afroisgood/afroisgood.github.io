// src/components/MonthWall.jsx
// 月份唱片牆：把一整個月的封面照星期排成牆，點封面跳到那天的單日頁

import { useState } from 'react';
import { formatDateString, isAtMinMonth } from '../utils/dateUtils';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

// 沒有封面（或圖片載入失敗）時的替代封套色，依日期輪替
const SLEEVES = [
    ['#2f4a5c', '#f2ece3'], ['#c8a048', '#1c1410'], ['#7a3b2e', '#f2ece3'], ['#d9cbb4', '#2a1808'],
    ['#3d5a40', '#f2ece3'], ['#1c1917', '#c8a048'], ['#b4513a', '#fdf6ec'], ['#5b4a6e', '#f2ece3'],
];

const getYouTubeId = (url) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match && match[2].length === 11 ? match[2] : null;
};

const coverSrc = (entry) => {
    if (entry.imageUrl) return entry.imageUrl;
    const yt = getYouTubeId(entry.youtube);
    return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null;
};

const WallTile = ({ date, entry, isSelected, onPick }) => {
    const [broken, setBroken] = useState(false);
    const day = date.getDate();
    const src = coverSrc(entry);
    const [bg, fg] = SLEEVES[day % SLEEVES.length];

    return (
        <button
            type="button"
            onClick={() => onPick(date)}
            aria-label={`${date.getMonth() + 1}月${day}日：${entry.artist}《${entry.album}》`}
            className={'wall-tile group relative aspect-square overflow-hidden text-left ' + (isSelected ? 'wall-tile--selected' : '')}
            style={{ background: bg, color: fg }}
        >
            {src && !broken ? (
                <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className="absolute inset-0 w-full h-full object-cover" />
            ) : (
                <span className="absolute left-2 right-2 bottom-2 flex flex-col gap-1">
                    <span className="font-playfair font-black text-[12px] lg:text-[14px] leading-tight line-clamp-3">{entry.album}</span>
                    <span className="hidden lg:block font-mono text-[9px] tracking-wider opacity-85 truncate">{entry.artist}</span>
                </span>
            )}

            <span className="wall-tile__day">{day}</span>

            {/* 桌機滑過或鍵盤聚焦時浮出專輯資訊；手機直接點就跳到那天 */}
            <span className="wall-tile__info">
                <span className="flex flex-col gap-1">
                    <span className="font-playfair font-black text-[14px] leading-tight line-clamp-3">{entry.album}</span>
                    <span className="text-[10px] font-bold tracking-wide leading-snug line-clamp-3">{entry.artist}</span>
                </span>
                <span className="font-mono font-bold text-[10px] tracking-[0.15em] text-[#e0bc68]">前往這天 →</span>
            </span>
        </button>
    );
};

export const MonthWall = ({ month, data, selectedDate, onPick, onMonthChange }) => {
    const year = month.getFullYear();
    const m = month.getMonth();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const leadingBlanks = new Date(year, m, 1).getDay();
    const selectedKey = formatDateString(selectedDate);
    const days = Array.from({ length: daysInMonth }, (_, i) => new Date(year, m, i + 1));
    const filled = days.filter(d => data[formatDateString(d)]).length;
    const monthName = month.toLocaleDateString('en-US', { month: 'long' });
    const atMin = isAtMinMonth(month);

    return (
        <div className="px-4 pt-6 pb-28 lg:px-12 lg:pt-9 lg:pb-10">
            <header className="flex items-end justify-between gap-4 mb-5">
                <div className="flex flex-col gap-1.5">
                    <div className="flex items-baseline gap-3">
                        <span className="font-playfair italic text-5xl lg:text-6xl leading-[0.9] text-stone-900">{monthName}</span>
                        <span className="font-mono font-bold text-sm lg:text-lg tracking-[0.2em] text-stone-900">{year}</span>
                    </div>
                    <span className="font-mono text-[11px] tracking-[0.25em] text-stone-600">{filled} RECORDS · {daysInMonth} DAYS</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => onMonthChange(new Date(year, m - 1, 1))}
                        disabled={atMin}
                        aria-label="上個月"
                        className="wall-nav"
                    >‹</button>
                    <button
                        type="button"
                        onClick={() => onMonthChange(new Date(year, m + 1, 1))}
                        aria-label="下個月"
                        className="wall-nav"
                    >›</button>
                </div>
            </header>

            <div className="hidden lg:grid grid-cols-7 gap-2.5 pt-2.5 pb-2 border-t-2 border-stone-900 font-mono text-[11px] tracking-[0.25em] text-stone-600 text-center">
                {WEEKDAYS.map(w => <span key={w}>{w}</span>)}
            </div>

            <div className="grid grid-cols-3 lg:grid-cols-7 gap-1.5 lg:gap-2.5 border-t-2 border-stone-900 pt-3 lg:border-t-0 lg:pt-0">
                {Array.from({ length: leadingBlanks }, (_, i) => (
                    <span key={'blank' + i} className="hidden lg:block aspect-square" aria-hidden="true" />
                ))}
                {days.map(date => {
                    const key = formatDateString(date);
                    const entry = data[key];
                    return entry ? (
                        <WallTile key={key} date={date} entry={entry} isSelected={key === selectedKey} onPick={onPick} />
                    ) : (
                        <span key={key} className="wall-tile--empty aspect-square" aria-hidden="true">
                            <span className="wall-tile__day">{date.getDate()}</span>
                        </span>
                    );
                })}
            </div>
        </div>
    );
};
