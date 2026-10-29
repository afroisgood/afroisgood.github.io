// src/components/IntroCalendar.jsx
// 開場：撕頁日曆從元旦快速翻到目標日期，資料到齊後撕下當日頁露出網站。
// 從首頁進站（網址沒有指定日期）時兼當入口：翻到今天後停住，讓讀者選日曆模式或唱片行模式再撕頁。
// animate 為 false（同分頁再次進站、減少動態效果）時不翻頁，直接停在今天。
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
        <span className="intro-cal-page__brand">JAZZ 365</span>
    </div>
);

const MODES = [
    { mode: 'day', title: '日曆模式', desc: '翻開今天的推薦' },
    { mode: 'shop', title: '唱片行模式', desc: '走進店裡挑唱片' },
];

export const IntroCalendar = ({ targetDate, ready, onDone, animate = true, choose = false, defaultChoice = 'day', onChoose }) => {
    const flipDates = useMemo(() => (animate ? buildFlipDates(targetDate) : []), [targetDate, animate]);
    const [flippedCount, setFlippedCount] = useState(0);
    const [landed, setLanded] = useState(!animate);
    const [timedOut, setTimedOut] = useState(false);
    const [skipped, setSkipped] = useState(false);
    const [chosen, setChosen] = useState(null);

    const tearing = choose ? Boolean(chosen) : skipped || (landed && (ready || timedOut));

    useEffect(() => {
        if (!animate) return;
        const timers = [];
        let t = FLIP_START_MS;
        flipDates.forEach((_, i) => {
            // 取較大值：按過 SKIP 之後，還沒觸發的計時器不會把已翻走的頁翻回來
            timers.push(setTimeout(() => setFlippedCount(c => Math.max(c, i + 1)), t));
            t += FLIP_GAPS_MS[i];
        });
        timers.push(setTimeout(() => setLanded(true), t + LAND_HOLD_MS));
        timers.push(setTimeout(() => setTimedOut(true), MAX_WAIT_MS));
        return () => timers.forEach(clearTimeout);
    }, [flipDates, animate]);

    const handleSkip = () => {
        if (!choose) { setSkipped(true); return; }
        // 要選模式時，SKIP 只略過翻頁，直接停在今天
        setFlippedCount(flipDates.length);
        setLanded(true);
    };

    const handleChoose = (mode) => {
        if (chosen) return;
        setChosen(mode);
        onChoose?.(mode);
    };

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

            {choose && landed ? (
                <div className="intro-choose" role="group" aria-label="選擇逛法">
                    {MODES.map(({ mode, title, desc }) => (
                        <button
                            key={mode}
                            type="button"
                            className={'intro-choose__btn ' + (mode === defaultChoice ? 'intro-choose__btn--last' : '')}
                            onClick={() => handleChoose(mode)}
                            disabled={Boolean(chosen)}
                            autoFocus={mode === defaultChoice}
                        >
                            <span className="intro-choose__title">{title}</span>
                            <span className="intro-choose__desc">{desc}</span>
                        </button>
                    ))}
                </div>
            ) : (
                <button type="button" className="intro-skip" onClick={handleSkip} aria-label="略過開場動畫">
                    SKIP ›
                </button>
            )}
        </div>
    );
};
