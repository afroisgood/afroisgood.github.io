// src/components/Sidebar.jsx
import { IconDisc } from './Icons';
import { RandomExplore } from './RandomExplore';

export const Sidebar = ({
    isPlaying,
    currentMonth,
    setCurrentMonth,
    selectedDate,
    handleDateChange,
    jazzData,
    setShowChangelog,
    latestVersion
}) => {

    const year  = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay    = new Date(year, month, 1).getDay();
    const days        = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks      = Array.from({ length: firstDay  }, (_, i) => i);
    const weekDays    = ['S','M','T','W','T','F','S'];

    const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const formatDateString = (y, m, d) =>
        `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    return (
        <aside
            className="hidden lg:flex lg:col-span-3 flex-col retro-win z-20 overflow-hidden"
            style={{
                position: 'sticky',
                top: '26px',
                height: 'calc(100vh - 34px)',
                alignSelf: 'flex-start',
            }}
        >
            {/* ── Window title bar ── */}
            <div className="retro-titlebar flex-shrink-0" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <span className="retro-ctrl">&#215;</span>
                <span className="retro-ctrl">&#8722;</span>
                <span className="retro-ctrl">&#9633;</span>
                <span style={{ flex: 1, textAlign: 'center', fontSize: '13px', letterSpacing: '0.16em', fontWeight: 'bold' }}>
                    DAILY JAZZ ALMANAC
                </span>
                <IconDisc
                    className={`transition-transform duration-1000 ${isPlaying ? 'animate-spin-slow' : ''}`}
                    size={11}
                    style={{ color: '#e0a870', flexShrink: 0 }}
                />
            </div>

            {/* ── Window body ── */}
            <div
                className="retro-body flex-1 overflow-y-auto hidden-scrollbar flex flex-col justify-between"
                style={{ padding: '20px 24px 16px' }}
            >
                <div style={{ flex: 1 }}>

                    {/* Brand subtitle */}
                    <div
                        className="cursor-pointer group"
                        style={{ marginBottom: '24px' }}
                        onClick={() => handleDateChange(new Date())}
                    >
                        <p style={{
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: '9px',
                            letterSpacing: '0.28em',
                            color: '#7a5840',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                        }}>
                            Daily Jazz Almanac
                        </p>
                    </div>

                    {/* Calendar */}
                    <div style={{ marginBottom: '16px' }}>
                        {/* Month nav */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <button onClick={handlePrevMonth} className="retro-nav">&lt;</button>
                            <h2 style={{
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: '13px',
                                fontWeight: 'bold',
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                color: '#2a1808',
                            }}>
                                {currentMonth.toLocaleString('default', { month: 'short' }).toUpperCase()} {year}
                            </h2>
                            <button onClick={handleNextMonth} className="retro-nav">&gt;</button>
                        </div>

                        {/* Day grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 1px', textAlign: 'center' }}>
                            {weekDays.map((d, i) => (
                                <div key={i} style={{
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: '8px',
                                    color: '#9a7860',
                                    fontWeight: 'bold',
                                    letterSpacing: '0.05em',
                                    paddingBottom: '4px',
                                }}>
                                    {d}
                                </div>
                            ))}
                            {blanks.map(b => <div key={`b-${b}`} />)}
                            {days.map(day => {
                                const dateStr   = formatDateString(year, month, day);
                                const hasData   = jazzData && jazzData[dateStr];
                                const isSelected = selectedDate.getDate() === day
                                    && selectedDate.getMonth() === month
                                    && selectedDate.getFullYear() === year;
                                const isToday    = new Date().getDate() === day
                                    && new Date().getMonth() === month
                                    && new Date().getFullYear() === year;

                                const baseStyle = {
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: '12px',
                                    padding: '3px 0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    position: 'relative',
                                    cursor: hasData ? 'pointer' : 'default',
                                    opacity: !hasData ? 0.22 : 1,
                                    transition: 'background 0.1s',
                                };

                                const selectedStyle = {
                                    ...baseStyle,
                                    backgroundColor: 'var(--mood-glow)',
                                    color: '#1a0808',
                                    fontWeight: 900,
                                    outline: '1px solid var(--mood-accent)',
                                };

                                const todayStyle = {
                                    ...baseStyle,
                                    color: 'var(--mood-accent)',
                                    fontWeight: 700,
                                    textDecoration: 'underline',
                                };

                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDateChange(new Date(year, month, day))}
                                        disabled={!hasData}
                                        style={isSelected ? selectedStyle : isToday ? todayStyle : { ...baseStyle, color: '#2a1808' }}
                                        onMouseEnter={e => { if (!isSelected && hasData) e.currentTarget.style.backgroundColor = '#e0d0c4'; }}
                                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.backgroundColor = ''; }}
                                    >
                                        {day}
                                        {hasData && !isSelected && (
                                            <span style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                width: '3px',
                                                height: '3px',
                                                borderRadius: '50%',
                                                backgroundColor: 'var(--mood-glow)',
                                                opacity: 0.5,
                                            }} />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Random Explore */}
                    <div style={{ marginTop: '20px', marginBottom: '16px' }}>
                        <RandomExplore jazzData={jazzData} onNavigate={handleDateChange} />
                    </div>

                    {/* Keyboard shortcuts */}
                    <div style={{
                        marginTop: '4px',
                        paddingTop: '12px',
                        borderTop: '1px dashed #c8b4a4',
                    }}>
                        <p style={{
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: '8px',
                            letterSpacing: '0.22em',
                            color: '#9a7860',
                            fontWeight: 'bold',
                            textTransform: 'uppercase',
                            marginBottom: '8px',
                        }}>
                            Keyboard
                        </p>
                        {[
                            ['← →', '切換日期'],
                            ['I', '沉浸模式'],
                            ['Space', '播放 / 暫停'],
                            ['Esc', '退出沉浸'],
                        ].map(([key, label]) => (
                            <div key={key} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '5px',
                            }}>
                                <span style={{
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: '9px',
                                    fontWeight: 'bold',
                                    color: '#f2ece3',
                                    background: '#3a2808',
                                    border: '1px solid #c8a048',
                                    borderRadius: '2px',
                                    padding: '1px 5px',
                                    letterSpacing: '0.05em',
                                    minWidth: '36px',
                                    textAlign: 'center',
                                    flexShrink: 0,
                                }}>
                                    {key}
                                </span>
                                <span style={{
                                    fontFamily: "'Courier New', Courier, monospace",
                                    fontSize: '9px',
                                    color: '#7a5840',
                                    letterSpacing: '0.08em',
                                }}>
                                    {label}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    paddingTop: '12px',
                    borderTop: '1px solid #c8b4a4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}>
                    <button
                        onClick={() => setShowChangelog(true)}
                        style={{
                            fontFamily: "'Courier New', Courier, monospace",
                            fontSize: '9px',
                            letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            fontWeight: 'bold',
                            color: '#7a5840',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = '#2a1808'}
                        onMouseLeave={e => e.currentTarget.style.color = '#7a5840'}
                    >
                        Update Log
                        <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--mood-glow)',
                            animation: 'pulse 2s infinite',
                            display: 'inline-block',
                        }} />
                    </button>
                    <span style={{
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: '9px',
                        color: '#9a8070',
                        fontWeight: 'bold',
                    }}>
                        {latestVersion}
                    </span>
                </div>
            </div>
        </aside>
    );
};
