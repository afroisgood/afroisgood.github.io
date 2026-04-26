// src/components/MobileNav.jsx
// 手機專用底部導航欄 + 日曆抽屜（lg 以上隱藏）
import { useState, useEffect } from 'react';
import { IconDisc, IconCalendar, IconClose } from './Icons';
import { RandomExplore } from './RandomExplore';
import { CalendarGrid } from './CalendarGrid';
import { CopyrightFooter } from './CopyrightFooter';
import { formatDateString, isAtMinMonth } from '../utils/dateUtils';

export const MobileNav = ({
    selectedDate,
    currentMonth,
    setCurrentMonth,
    handleDateChange,
    handlePrevDay,
    handleNextDay,
    jazzData,
    isVinylSpinning,
}) => {
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        document.body.style.overflow = drawerOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [drawerOpen]);

    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const atMinMonth = isAtMinMonth(currentMonth);
    const handlePrevMonth = () => { if (!atMinMonth) setCurrentMonth(new Date(year, month - 1, 1)); };
    const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const handleDayClick = (date) => {
        handleDateChange(date);
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
                            className={`text-amber-500 flex-shrink-0 ${isVinylSpinning ? 'animate-spin-slow' : ''}`}
                            size={18}
                        />
                        <span className="font-bold text-white font-playfair whitespace-nowrap" style={{ fontSize: '13px', letterSpacing: '0.05em' }}>日めくりジャズ365</span>
                    </div>

                    {/* 月份切換 */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={handlePrevMonth}
                            disabled={atMinMonth}
                            className="p-2 font-bold text-lg transition-colors"
                            style={{ color: atMinMonth ? 'rgba(113,113,122,0.3)' : '', cursor: atMinMonth ? 'default' : 'pointer' }}
                        >&lt;</button>
                        <h2 className="text-sm font-bold tracking-widest uppercase font-playfair text-white">
                            {monthLabel} {year}
                        </h2>
                        <button onClick={handleNextMonth} className="text-zinc-400 hover:text-amber-400 transition-colors p-2 font-bold text-lg">&gt;</button>
                    </div>

                    {/* 日曆 Grid */}
                    <div className="mb-2">
                        <CalendarGrid
                            year={year}
                            month={month}
                            selectedDate={selectedDate}
                            jazzData={jazzData}
                            onDayClick={handleDayClick}
                            theme="dark"
                        />
                    </div>

                    {/* 隨機探索 */}
                    <RandomExplore
                        jazzData={jazzData}
                        onNavigate={(date) => { handleDateChange(date); setDrawerOpen(false); }}
                    />

                    {/* 版權聲明 */}
                    <CopyrightFooter theme="dark" />
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
                        <IconCalendar />
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
