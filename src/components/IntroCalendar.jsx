// src/components/IntroCalendar.jsx
// 首次造訪的開場動畫：日めくり日曆從元旦快速翻到目標日期，資料到齊後撕下當日頁露出網站
import { useEffect, useMemo, useState } from 'react';

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];

const FLIP_START_MS = 350;
const FLIP_GAPS_MS = [280, 230, 210, 260]; // 先快後慢，像手指撥頁停在目標日
const LAND_HOLD_MS = 350;
const TEAR_MS = 600;
const MAX_WAIT_MS = 4000; // 網路再慢也不讓開場卡住，逾時就先撕頁，網站以骨架屏接手

const buildFlipDates = (target) => {
    const start = new Date(target.getFullYear(), 0, 1);
    const spanDays = Math.round((target - start) / 86400000);
    const count = Math.min(FLIP_GAPS_MS.length, spanDays);
    const dates = [];
    for (let i = 0; i < count; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + Math.round((spanDays * i) / count));
        dates.push(d);
    }
    return dates;
};

const CalendarPage = ({ date, className = '', children }) => (
    <div className={`intro-cal-page ${className}`}>
        <div className="intro-cal-page__top">
            <span>{date.getFullYear()}</span>
            <span>{WEEKDAYS[date.getDay()]}</span>
        </div>
        <span className="intro-cal-page__day">{String(date.getDate()).padStart(2, '0')}</span>
        <span className="intro-cal-page__month">{MONTHS[date.getMonth()]}</span>
        {children}
        <span className="intro-cal-page__brand">日めくりジャズ365</span>
    </div>
);

export const IntroCalendar = ({ targetDate, ready, onDone }) => {
    const flipDates = useMemo(() => buildFlipDates(targetDate), [targetDate]);
    const [flippedCount, setFlippedCount] = useState(0);
    const [landed, setLanded] = useState(false);
    const [timedOut, setTimedOut] = useState(false);
    const [skipped, setSkipped] = useState(false);

    const tearing = skipped || (landed && (ready || timedOut));

    useEffect(() => {
        const timers = [];
        let t = FLIP_START_MS;
        flipDates.forEach((_, i) => {
            timers.push(setTimeout(() => setFlippedCount(i + 1), t));
            t += FLIP_GAPS_MS[i];
        });
        timers.push(setTimeout(() => setLanded(true), t + LAND_HOLD_MS));
        timers.push(setTimeout(() => setTimedOut(true), MAX_WAIT_MS));
        return () => timers.forEach(clearTimeout);
    }, [flipDates]);

    useEffect(() => {
        if (!tearing) return;
        const timer = setTimeout(onDone, TEAR_MS);
        return () => clearTimeout(timer);
    }, [tearing, onDone]);

    return (
        <div className={`intro-overlay retro-desktop ${tearing ? 'intro-overlay--out' : ''}`}>
            <div className="intro-cal-pad" aria-hidden="true">
                <div className="intro-cal-binding">
                    <span className="intro-cal-ring"></span>
                    <span className="intro-cal-ring"></span>
                </div>
                <div className="intro-cal-stack">
                    <CalendarPage date={targetDate} className={tearing ? 'intro-cal-page--tear' : ''}>
                        <span className={`intro-cal-page__rule ${landed ? 'intro-cal-page__rule--on' : ''}`}></span>
                    </CalendarPage>
                    {flipDates.map((date, i) => ({ date, i })).reverse().map(({ date, i }) => (
                        <CalendarPage
                            key={i}
                            date={date}
                            className={flippedCount > i ? 'intro-cal-page--out' : ''}
                        />
                    ))}
                </div>
            </div>

            <button type="button" className="intro-skip" onClick={() => setSkipped(true)} aria-label="略過開場動畫">
                SKIP ›
            </button>
        </div>
    );
};
