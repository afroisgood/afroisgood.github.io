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
    
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
    const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    const formatDateString = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

    return (
        <aside className="hidden lg:flex lg:col-span-3 lg:sticky lg:top-0 h-screen border-r border-white/20 flex-col justify-between bg-zinc-950 z-20 overflow-y-auto hidden-scrollbar pt-12 pb-6 px-8">
            
            <div className="flex-1">
                <div className="mb-12 cursor-pointer group" onClick={() => handleDateChange(new Date())}>
                    <div className="flex items-center gap-3 mb-3">
                        <IconDisc 
                            className={`text-amber-500 transition-transform duration-1000 ${isPlaying ? 'animate-spin-slow' : ''}`} 
                            size={28} 
                        />
                        {/* 提亮為純白 */}
                        <h1 className="text-xl font-bold tracking-widest text-white font-playfair">JAZZ 365</h1>
                    </div>
                    {/* 提亮為 zinc-400 */}
                    <p className="text-[10px] tracking-[0.3em] text-zinc-400 font-medium uppercase group-hover:text-amber-400 transition-colors">
                        Daily Jazz Almanac
                    </p>
                </div>

                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={handlePrevMonth} className="text-zinc-400 hover:text-amber-400 transition-colors p-1 font-bold">&lt;</button>
                        <h2 className="text-sm font-bold tracking-widest uppercase font-playfair text-white">
                            {currentMonth.toLocaleString('default', { month: 'long' })} {year}
                        </h2>
                        <button onClick={handleNextMonth} className="text-zinc-400 hover:text-amber-400 transition-colors p-1 font-bold">&gt;</button>
                    </div>

                    <div className="grid grid-cols-7 gap-y-3 gap-x-1 text-center mb-2">
                        {weekDays.map(day => (
                            <div key={day} className="text-[9px] text-zinc-400 tracking-wider uppercase font-bold">{day}</div>
                        ))}
                        {blanks.map(blank => <div key={`blank-${blank}`} />)}
                        {days.map(day => {
                            const dateStr = formatDateString(year, month, day);
                            const hasData = jazzData && jazzData[dateStr];
                            const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
                            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleDateChange(new Date(year, month, day))}
                                    disabled={!hasData}
                                    className={`
                                        relative text-xs py-1.5 w-full flex items-center justify-center transition-all duration-300 rounded-sm
                                        ${!isSelected && hasData ? 'hover:bg-zinc-800 text-white font-medium' : ''}
                                        ${!hasData ? 'opacity-40 cursor-not-allowed text-zinc-500' : 'cursor-pointer'}
                                    `}
                                    style={isSelected ? { backgroundColor: 'var(--mood-glow)', color: '#09090b', fontWeight: 900 } : isToday ? { color: 'var(--mood-glow)', fontWeight: 700 } : {}}
                                >
                                    {day}
                                    {hasData && !isSelected && (
                                        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full opacity-60" style={{ backgroundColor: 'var(--mood-glow)' }}></span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-8 mb-10 px-1">
                    <RandomExplore
                        jazzData={jazzData}
                        onNavigate={handleDateChange}
                    />
                </div>
            </div>

            <div className="pt-6 border-t border-white/20 flex items-center justify-between">
                <button 
                    onClick={() => setShowChangelog(true)}
                    className="text-[10px] tracking-widest text-zinc-300 transition-colors flex items-center gap-1 uppercase font-bold"
                    style={{ '--tw-text-opacity': 1 }}
                    onMouseEnter={e => e.currentTarget.style.color = 'var(--mood-glow)'}
                    onMouseLeave={e => e.currentTarget.style.color = ''}
                >
                    Update Log <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--mood-glow)' }}></span>
                </button>
                <span className="text-[10px] text-zinc-500 font-mono font-bold">{latestVersion}</span>
            </div>
            
        </aside>
    );
};