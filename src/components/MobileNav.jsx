// src/components/MobileNav.jsx
// 手機專用底部導航欄 + 日曆抽屜（lg 以上隱藏）
import { useState } from 'react';
import { IconDisc } from './Icons';
import { RandomExplore } from './RandomExplore';

const CalendarIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
);

const CloseIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
);

export const MobileNav = ({
    selectedDate,
    currentMonth,
    setCurrentMonth,
    handleDateChange,
    handlePrevDay,
    handleNextDay,
    jazzData,
    isPlaying,
}) => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const formatDateString = (y, m, d) =>
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const handleDayClick = (day) => {
        handleDateChange(new Date(year, month, day));
        setDrawerOpen(false);
    };

    const monthLabel = currentMonth.toLocaleString('default', { month: 'long' });

    const dateLabel = selectedDate.toLocaleDateString('zh-TW', {
        month: 'numeric', day: 'numeric',
    });

    return (
        <>
            {/* 日曆抽屜背景遮罩 */}
            {drawerOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                    onClick={() => setDrawerOpen(false)}
                />
            )}

            {/* 日曆抽屜 */}
            <div
                className={`fixed bottom-14 left-0 right-0 z-50 lg:hidden bg-zinc-950 border-t border-white/20 rounded-t-2xl transition-transform duration-300 ease-out overflow-y-auto max-h-[80vh] ${drawerOpen ? 'translate-y-0' : 'translate-y-full'}`}
            >
                <div className="px-5 pt-4 pb-6">
                    {/* 拖曳把手 */}
                    <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-5"/>

                    {/* JAZZ 365 Logo */}
                    <div
                        className="flex items-center gap-2 mb-6 cursor-pointer"
                        onClick={() => { handleDateChange(new Date()); setDrawerOpen(false); }}
                    >
                        <IconDisc
                            className={`text-amber-500 flex-shrink-0 ${isPlaying ? 'animate-spin-slow' : ''}`}
                            size={18}
                        />
                        <span className="font-bold text-white font-playfair whitespace-nowrap" style={{ fontSize: '13px', letterSpacing: '0.05em' }}>日めくりジャズ365</span>
                    </div>

                    {/* 月份切換 */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handlePrevMonth} className="text-zinc-400 hover:text-amber-400 transition-colors p-2 font-bold text-lg">&lt;</button>
                        <h2 className="text-sm font-bold tracking-widest uppercase font-playfair text-white">
                            {monthLabel} {year}
                        </h2>
                        <button onClick={handleNextMonth} className="text-zinc-400 hover:text-amber-400 transition-colors p-2 font-bold text-lg">&gt;</button>
                    </div>

                    {/* 日曆 Grid */}
                    <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center mb-2">
                        {weekDays.map((d, i) => (
                            <div key={i} className="text-[10px] text-zinc-400 tracking-wider uppercase font-bold">{d}</div>
                        ))}
                        {blanks.map(b => <div key={`b-${b}`} />)}
                        {days.map(day => {
                            const dateStr = formatDateString(year, month, day);
                            const hasData = jazzData && jazzData[dateStr];
                            const isSelected = selectedDate.getDate() === day &&
                                selectedDate.getMonth() === month &&
                                selectedDate.getFullYear() === year;
                            const isToday = new Date().getDate() === day &&
                                new Date().getMonth() === month &&
                                new Date().getFullYear() === year;
                            return (
                                <button
                                    key={day}
                                    onClick={() => hasData && handleDayClick(day)}
                                    disabled={!hasData}
                                    className={`
                                        relative text-xs py-2 w-full flex items-center justify-center transition-all rounded-sm
                                        ${!isSelected && hasData ? 'hover:bg-zinc-800 text-white font-medium' : ''}
                                        ${!hasData ? 'opacity-30 cursor-not-allowed text-zinc-500' : 'cursor-pointer'}
                                    `}
                                    style={isSelected ? { backgroundColor: 'var(--mood-glow)', color: '#09090b', fontWeight: 900 } : isToday ? { color: 'var(--mood-glow)', fontWeight: 700 } : {}}
                                >
                                    {day}
                                    {hasData && !isSelected && (
                                        <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0.5 h-0.5 rounded-full" style={{ backgroundColor: 'var(--mood-glow)' }}/>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* 隨機探索 */}
                    <RandomExplore
                        jazzData={jazzData}
                        onNavigate={(date) => { handleDateChange(date); setDrawerOpen(false); }}
                    />

                    {/* 版權聲明 */}
                    <div style={{
                        marginTop: '24px',
                        paddingTop: '16px',
                        borderTop: '1px solid rgba(255,255,255,0.08)',
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: '9px',
                        lineHeight: 1.9,
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.03em',
                    }}>
                        <p>© 2026 ジャズ録音日調査委員会. All editorial rights reserved.</p>
                        <p>All Chinese translations are independently produced by the site author</p>
                        <p>and do not represent official translations of any source material.</p>
                        <p>Music and recordings remain the property of their respective rights holders.</p>
                        <p style={{ marginTop: '8px' }}>For corrections or feedback, please contact:</p>
                        <p>如有任何指正或回饋，歡迎來信：</p>
                        <p>
                            和煦人 —{' '}
                            <a
                                href="mailto:monkeyboy2766@gmail.com"
                                style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'underline' }}
                            >
                                monkeyboy2766@gmail.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>

            {/* 底部導航欄 */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-zinc-950/95 backdrop-blur border-t border-white/20 h-14 flex items-center justify-between px-4">
                {/* 前一天 */}
                <button
                    onClick={handlePrevDay}
                    className="text-zinc-400 transition-colors p-2 font-bold text-lg"
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--mood-glow)'}
                    onMouseLeave={e => e.currentTarget.style.color = ''}
                >
                    &#8592;
                </button>

                {/* 日期 + 日曆開關 */}
                <button
                    onClick={() => setDrawerOpen(v => !v)}
                    className="flex flex-col items-center gap-0.5 transition-all"
                >
                    <div
                        className="flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all"
                        style={{
                            background: drawerOpen ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.05)',
                            borderColor: drawerOpen ? 'var(--mood-glow)' : 'rgba(255,255,255,0.18)',
                            color: drawerOpen ? 'var(--mood-glow)' : '#ffffff',
                        }}
                    >
                        <CalendarIcon />
                        <span className="text-sm font-bold tracking-wider">{dateLabel}</span>
                        <svg
                            width="10" height="10" viewBox="0 0 10 10" fill="none"
                            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            style={{ transition: 'transform 0.25s ease', transform: drawerOpen ? 'rotate(180deg)' : 'rotate(0deg)', opacity: 0.7 }}
                        >
                            <polyline points="1,7 5,3 9,7" />
                        </svg>
                    </div>
                    <span style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: '8px',
                        letterSpacing: '0.18em',
                        color: 'rgba(255,255,255,0.28)',
                        textTransform: 'uppercase',
                        lineHeight: 1,
                    }}>
                        tap to browse
                    </span>
                </button>

                {/* 後一天 */}
                <button
                    onClick={handleNextDay}
                    className="text-zinc-400 transition-colors p-2 font-bold text-lg"
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--mood-glow)'}
                    onMouseLeave={e => e.currentTarget.style.color = ''}
                >
                    &#8594;
                </button>
            </nav>
        </>
    );
};
