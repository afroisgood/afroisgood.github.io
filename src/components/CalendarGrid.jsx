// src/components/CalendarGrid.jsx
// 共用月曆 Grid 元件 — Sidebar（light）與 MobileNav（dark）共用

import { formatDateString, isToday as checkIsToday } from '../utils/dateUtils';

const WEEK_DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export const CalendarGrid = ({ year, month, selectedDate, jazzData, onDayClick, theme = 'light' }) => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = new Date(year, month, 1).getDay();
    const days        = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks      = Array.from({ length: firstDay }, (_, i) => i);

    const isDark = theme === 'dark';

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: '2px 1px',
            textAlign: 'center',
        }}>
            {/* 星期標題列 */}
            {WEEK_DAYS.map((d, i) => (
                <div key={i} style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: isDark ? '10px' : '8px',
                    color: isDark ? 'rgba(161,161,170,1)' : '#9a7860',
                    fontWeight: 'bold',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    paddingBottom: '4px',
                }}>
                    {d}
                </div>
            ))}

            {/* 空白格 */}
            {blanks.map(b => <div key={`b-${b}`} />)}

            {/* 日期格 */}
            {days.map(day => {
                const dateStr    = formatDateString(new Date(year, month, day));
                const hasData    = jazzData && jazzData[dateStr];
                const isSelected = selectedDate.getDate() === day &&
                                   selectedDate.getMonth() === month &&
                                   selectedDate.getFullYear() === year;
                const isToday    = checkIsToday(new Date(year, month, day));

                // 依主題設定樣式
                const baseStyle = {
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: isDark ? '12px' : '12px',
                    padding: '3px 0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative',
                    cursor: hasData ? 'pointer' : 'default',
                    opacity: !hasData ? (isDark ? 0.3 : 0.22) : 1,
                    transition: 'background 0.1s',
                    borderRadius: isDark ? '2px' : '0',
                    color: isDark ? (hasData ? '#ffffff' : 'rgba(113,113,122,1)') : '#2a1808',
                    fontWeight: hasData ? 500 : 400,
                };

                const selectedStyle = {
                    ...baseStyle,
                    backgroundColor: 'var(--mood-glow)',
                    color: isDark ? '#09090b' : '#1a0808',
                    fontWeight: 900,
                    outline: isDark ? 'none' : '1px solid var(--mood-accent)',
                };

                const todayStyle = {
                    ...baseStyle,
                    color: 'var(--mood-glow)',
                    fontWeight: 700,
                    textDecoration: 'underline',
                };

                const currentStyle = isSelected ? selectedStyle : isToday ? todayStyle : baseStyle;

                return (
                    <button
                        key={day}
                        onClick={() => hasData && onDayClick(new Date(year, month, day))}
                        disabled={!hasData}
                        style={currentStyle}
                        onMouseEnter={e => {
                            if (!isSelected && hasData)
                                e.currentTarget.style.backgroundColor = isDark ? 'rgba(39,39,42,1)' : '#e0d0c4';
                        }}
                        onMouseLeave={e => {
                            if (!isSelected)
                                e.currentTarget.style.backgroundColor = '';
                        }}
                    >
                        {day}
                        {hasData && !isSelected && (
                            <span style={{
                                position: 'absolute',
                                bottom: 0,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                width: isDark ? '2px' : '3px',
                                height: isDark ? '2px' : '3px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--mood-glow)',
                                opacity: 0.5,
                            }} />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
