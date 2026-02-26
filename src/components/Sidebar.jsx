import { IconDisc, IconChevronLeft, IconChevronRight } from './Icons';

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
    // 獨立出日期格式化邏輯
    const formatDateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dateKey = formatDateString(selectedDate);

    return (
        <div className="lg:col-span-3 bg-stone-900 text-stone-300 p-8 lg:min-h-screen flex flex-col justify-between relative z-20 shadow-2xl">
            <div>
                <div className="mb-12 pt-4 flex flex-col items-start">
                    <div className="flex items-center gap-3 text-amber-500 mb-2">
                        <IconDisc className={isPlaying ? "animate-spin-fast" : "animate-spin-slow"} size={28} />
                        <span className="text-xs tracking-[0.3em] uppercase font-bold">Daily Jazz</span>
                    </div>
                    <h1 className="text-3xl font-zen font-bold text-stone-100 leading-snug">日めくり<br/>ジャズ 365</h1>
                    <div className="w-12 h-1 bg-amber-600 mt-4"></div>
                </div>
                
                <div className="mb-8">
                    <div className="flex items-center justify-between mb-6 border-b border-stone-800 pb-2">
                        <span className="font-playfair text-2xl text-stone-100 italic">
                            {currentMonth.toLocaleString('en-US', { month: 'short' })} '{currentMonth.getFullYear().toString().slice(2)}
                        </span>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}><IconChevronLeft/></button>
                            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}><IconChevronRight/></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-y-3 gap-x-1 place-items-center">
                        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => <span key={i} className="text-[10px] text-stone-600 font-bold">{day}</span>)}
                        {(() => {
                            const year = currentMonth.getFullYear(); 
                            const month = currentMonth.getMonth(); 
                            const daysInMonth = new Date(year, month + 1, 0).getDate(); 
                            const firstDay = new Date(year, month, 1).getDay(); 
                            const days = [];
                            
                            for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="h-8 w-8"></div>);
                            
                            for (let d = 1; d <= daysInMonth; d++) {
                                const currDate = new Date(year, month, d); 
                                const currKey = formatDateString(currDate); 
                                const isSelected = dateKey === currKey;
                                days.push(
                                    <button key={d} onClick={() => handleDateChange(currDate)} className={`h-8 w-8 flex items-center justify-center text-sm relative transition-all duration-300 font-serif ${isSelected ? 'text-amber-400 font-bold scale-125' : 'text-stone-400 hover:text-stone-200'}`}>
                                        <span>{d}</span>
                                        {jazzData.hasOwnProperty(currKey) && !isSelected && <span className="absolute -bottom-1 w-1 h-1 bg-amber-600 rounded-full"></span>}
                                    </button>
                                );
                            }
                            return days;
                        })()}
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col gap-2 mt-8">
                <button onClick={() => setShowChangelog(true)} className="text-[10px] text-amber-600/60 hover:text-amber-500 transition tracking-widest text-left w-fit uppercase font-bold border-b border-amber-900/30 pb-0.5">{latestVersion} Log</button>
                <div className="text-[10px] text-stone-600 tracking-widest uppercase"><p>© 2026 TEYLUNG TRANS.</p></div>
            </div>
        </div>
    );
};