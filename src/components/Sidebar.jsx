// src/components/Sidebar.jsx
import { RandomExplore } from './RandomExplore';
import { CalendarGrid } from './CalendarGrid';
import { RetroTitleBar } from './RetroTitleBar';
import { formatDateString, isAtMinMonth } from '../utils/dateUtils';

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

    const atMinMonth = isAtMinMonth(currentMonth);
    const handlePrevMonth = () => { if (!atMinMonth) setCurrentMonth(new Date(year, month - 1, 1)); };
    const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

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
            <RetroTitleBar
                title="DAILY JAZZ ALMANAC"
                className="flex-shrink-0"
                showDisc
                isPlaying={isPlaying}
            />

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
                            <button
                                onClick={handlePrevMonth}
                                className="retro-nav"
                                disabled={atMinMonth}
                                style={{ opacity: atMinMonth ? 0.2 : 1, cursor: atMinMonth ? 'default' : 'pointer' }}
                            >&lt;</button>
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
                        <CalendarGrid
                            year={year}
                            month={month}
                            selectedDate={selectedDate}
                            jazzData={jazzData}
                            onDayClick={handleDateChange}
                            theme="light"
                        />
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
                <div style={{ paddingTop: '12px', borderTop: '1px solid #c8b4a4' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
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
                    <div style={{
                        fontFamily: "'Courier New', Courier, monospace",
                        fontSize: '8px',
                        lineHeight: 1.8,
                        color: '#9a7860',
                        letterSpacing: '0.03em',
                    }}>
                        <p>© 2026 ジャズ録音日調査委員会. All editorial rights reserved.</p>
                        <p>All Chinese translations are independently produced by the site author</p>
                        <p>and do not represent official translations of any source material.</p>
                        <p>Music and recordings remain the property of their respective rights holders.</p>
                        <p style={{ marginTop: '6px' }}>For corrections or feedback, please contact:</p>
                        <p>如有任何指正或回饋，歡迎來信：</p>
                        <p>
                            和煦人 —{' '}
                            <a href="mailto:monkeyboy2766@gmail.com" style={{ color: '#7a5840', textDecoration: 'underline' }}>
                                monkeyboy2766@gmail.com
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
};
