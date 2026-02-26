import { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';

// 引入已經拆分出去的工具與組件
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { Sidebar } from './components/Sidebar';
import { EditorNote } from './components/EditorNote';
import { 
    IconDisc, IconChevronLeft, IconChevronRight, IconQuote, 
    IconArrowRight, IconX, IconPlay, IconPause, StoneVinylIcon 
} from './components/Icons';

const App = () => {
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [jazzData, setJazzData] = useState({});
    const [changelogData, setChangelogData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [tearDirection, setTearDirection] = useState(null);
    const [isHoveringLink, setIsHoveringLink] = useState(false);
    const [showChangelog, setShowChangelog] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    
    const SHEET_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTluUWYKc4YGQwNvjR-aAYJGDmhkc-umEEgCis548UWm7cR0MkJk_6kxnn4jmDpzEgfghXBGheCdU2l/pub?output=csv";
    const DATA_URL = `${SHEET_BASE_URL}&gid=0`;
    const LOG_URL = `${SHEET_BASE_URL}&gid=1202139946`;

    const genreColors = { "Bebop": "#FDE68A", "Cool Jazz": "#BFDBFE", "Fusion": "#DDD6FE", "Swing": "#FECACA", "Hard Bop": "#FED7AA", "Free Jazz": "#E2E8F0" };
    const formatDateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const dateKey = formatDateString(selectedDate);
    const currentData = jazzData[dateKey];
    
    const getYouTubeVideoId = (url) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };
    
    const youtubeId = useMemo(() => getYouTubeVideoId(currentData?.youtube), [currentData]);
    
    const { player, playerState } = useYouTubePlayer(isImmersive ? youtubeId : null);
    
    const isVinylSpinning = playerState === 1 || playerState === 3;

    const togglePlay = useCallback((e) => {
        if (e) e.stopPropagation();
        if (player && typeof player.playVideo === 'function') {
            if (playerState === 1) {
                player.pauseVideo();
            } else {
                player.playVideo();
            }
        }
    }, [player, playerState]);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && /^\d{4}-\d{2}-\d{2}$/.test(hash)) {
                const [y, m, d] = hash.split('-').map(Number);
                const hashDate = new Date(y, m - 1, d);
                if (!isNaN(hashDate) && formatDateString(hashDate) !== formatDateString(selectedDate)) {
                    triggerTransition(hashDate);
                }
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [selectedDate]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isImmersive) {
                handleCloseImmersive();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isImmersive]);

    const handleCloseImmersive = () => {
        if (player && typeof player.pauseVideo === 'function') {
            player.pauseVideo();
        }
        setIsImmersive(false);
    };

    const triggerTransition = (newDate) => {
        if (player && playerState === 1 && typeof player.pauseVideo === 'function') {
           player.pauseVideo();
        }

        const direction = newDate > selectedDate ? 'forward' : 'backward';
        setTearDirection(direction);
        setIsPlaying(false);
        setTimeout(() => {
            setSelectedDate(newDate);
            setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
            setTearDirection(null);
            setTimeout(() => setIsPlaying(true), 400);
        }, 850);
    };

    const handleDateChange = (newDate) => {
        if (tearDirection) return;
        window.location.hash = formatDateString(newDate);
    };

    const handlePrevDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(selectedDate.getDate() - 1);
        handleDateChange(prev);
    };

    const handleNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(selectedDate.getDate() + 1);
        handleDateChange(next);
    };

    useEffect(() => {
        const fetchAllData = async () => {
            Papa.parse(DATA_URL, {
                download: true, header: true, skipEmptyLines: true,
                complete: (results) => {
                    const dataMap = {};
                    results.data.forEach(row => { if (row.date) dataMap[row.date.trim()] = row; });
                    setJazzData(dataMap);
                    const hash = window.location.hash.replace('#', '');
                    if (hash && dataMap[hash]) {
                        const [y, m, d] = hash.split('-').map(Number);
                        const initialDate = new Date(y, m - 1, d);
                        setSelectedDate(initialDate);
                        setCurrentMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
                    }
                }
            });
            Papa.parse(LOG_URL, {
                download: true, header: true, skipEmptyLines: true,
                complete: (results) => { setChangelogData(results.data); }
            });
            setTimeout(() => { setLoading(false); setIsPlaying(true); }, 2000);
        };
        fetchAllData();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center text-amber-500 font-zen p-6 text-center">
            <IconDisc className="animate-spin-fast mb-10" size={80} />
            <div className="page-reveal">
                <p className="text-lg lg:text-xl tracking-[0.2em] leading-relaxed max-w-2xl font-medium">JAZZ，是一種帶著焦臭味、撲面而來的文字</p>
                <p className="text-sm mt-6 opacity-60 tracking-[0.3em] uppercase">— 平岡正明</p>
            </div>
        </div>
    );
    
    const latestVersion = changelogData[0]?.version || "v1.0.0";

    return (
        <div className="min-h-screen bg-image-paper font-sans text-stone-800 relative overflow-x-hidden transition-colors duration-1000" style={{ backgroundColor: genreColors[currentData?.mood?.trim()] || currentData?.mood || "#f2f0e9" }}>
            
            {/* 沉浸模式 (Overlay) */}
            {isImmersive && (
                <div className="fixed inset-0 z-[200] immersive-bg text-stone-200 flex flex-col items-center justify-center immersive-overlay">
                    
                    <button onClick={handleCloseImmersive} className="absolute top-8 right-8 p-2 text-stone-500 hover:text-white transition-colors duration-300 z-50">
                        <IconX size={32} />
                        <span className="sr-only">Close</span>
                    </button>

                    <div className="w-full max-w-4xl flex flex-col items-center relative">
                        <div className="text-stone-500 font-zen tracking-widest mb-12 text-sm uppercase">
                            {selectedDate.getFullYear()} . {selectedDate.toLocaleString('en-US', { month: 'long' })} . {selectedDate.getDate()}
                        </div>

                        {/* 唱片區域 */}
                        <div 
                            className="relative w-[70vw] max-w-[450px] aspect-square flex items-center justify-center mb-12 group cursor-pointer"
                            onClick={togglePlay}
                        >
                            <button onClick={(e) => {e.stopPropagation(); handlePrevDay();}} className="absolute -left-16 lg:-left-24 top-1/2 -translate-y-1/2 p-4 text-stone-600 hover:text-white transition opacity-50 hover:opacity-100 hover:scale-110 z-40"><IconChevronLeft size={40}/></button>
                            <button onClick={(e) => {e.stopPropagation(); handleNextDay();}} className="absolute -right-16 lg:-right-24 top-1/2 -translate-y-1/2 p-4 text-stone-600 hover:text-white transition opacity-50 hover:opacity-100 hover:scale-110 z-40"><IconChevronRight size={40}/></button>
                            
                            {/* YouTube Player Mount Point */}
                            {youtubeId && (
                                <div className="absolute inset-0 z-0 opacity-0 pointer-events-none">
                                    <div id="yt-player-mount"></div>
                                </div>
                            )}

                            <div className={`w-full h-full rounded-full shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 border border-stone-800 transition-all duration-1000 ${isVinylSpinning ? 'animate-spin-vinyl' : ''}`}>
                                {currentData?.imageUrl ? (
                                    <img src={currentData.imageUrl} className="w-full h-full object-cover opacity-90" />
                                ) : (
                                    <div className="w-full h-full bg-stone-900 flex items-center justify-center"><IconDisc size={100} className="text-stone-700"/></div>
                                )}
                                <div className="absolute inset-0 rounded-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                                <div className="absolute inset-0 rounded-full border-[1px] border-white/5"></div>
                            </div>
                            
                            <div className={`absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/30 transition-all duration-300 ${isVinylSpinning ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                                <div className="w-20 h-20 rounded-full bg-stone-100/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl transform transition-transform group-hover:scale-110">
                                    {isVinylSpinning ? <IconPause size={32} /> : <IconPlay size={32} />}
                                </div>
                            </div>

                            <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-tr from-white/0 to-white/5 pointer-events-none rounded-tr-full z-20"></div>
                        </div>

                        <div className="text-center space-y-4 max-w-2xl px-6">
                            <h2 className="text-3xl lg:text-5xl font-playfair italic text-stone-100 leading-tight">
                                {currentData?.album || "No Album Data"}
                            </h2>
                            <p className="text-lg lg:text-xl text-amber-500/80 tracking-widest font-light">
                                {currentData?.artist || "Unknown Artist"}
                            </p>
                        </div>
                        
                        <div className="mt-8 text-stone-600 text-xs tracking-[0.2em] uppercase font-bold opacity-60">
                            {isVinylSpinning ? "Now Spinning" : "Click Vinyl to Play"}
                        </div>
                    </div>
                </div>
            )}
            
            {/* 更新履歷內容 */}
            {showChangelog && (
                <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-start lg:pl-20 pointer-events-none">
                    <div className="changelog-panel bg-stone-900/95 backdrop-blur-xl text-stone-300 p-8 w-full lg:w-[400px] h-3/4 lg:h-auto lg:max-h-[600px] shadow-2xl pointer-events-auto border-t lg:border border-amber-900/50 overflow-y-auto">
                        <div className="flex justify-between items-start mb-8"><h3 className="font-zen font-black text-amber-500 tracking-[0.3em] text-lg uppercase">更新履歷</h3><button onClick={() => setShowChangelog(false)} className="text-stone-500 hover:text-white transition"><IconX size={24}/></button></div>
                        <div className="space-y-8 font-zen text-sm leading-relaxed">
                            {changelogData.map((log, idx) => (<div key={idx} className={`border-l-2 ${idx === 0 ? 'border-amber-700' : 'border-stone-700 opacity-50'} pl-4`}><p className={`${idx === 0 ? 'text-amber-600' : ''} font-bold mb-1`}>{log.version} ({log.date})</p><p className="whitespace-pre-line">{log.content}</p></div>))}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-[1400px] mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
                
                {/* 引入左側日曆組件 */}
                <Sidebar 
                    isPlaying={isPlaying}
                    currentMonth={currentMonth}
                    setCurrentMonth={setCurrentMonth}
                    selectedDate={selectedDate}
                    handleDateChange={handleDateChange}
                    jazzData={jazzData}
                    setShowChangelog={setShowChangelog}
                    latestVersion={latestVersion}
                />
                
                <div className="lg:col-span-9 relative p-6 lg:p-12 flex flex-col justify-start pt-20 lg:pt-32 min-h-screen">
                    {currentData?.editorNote?.trim() && (
                        <div className="absolute top-12 right-12 z-40 max-w-[300px] hidden lg:block">
                            <EditorNote note={currentData.editorNote} />
                        </div>
                    )}

                    <div className="absolute top-0 right-0 lg:right-20 -z-10 select-none opacity-5 pointer-events-none"><span className="font-playfair text-[20rem] lg:text-[25rem] leading-none text-stone-900">{String(selectedDate.getDate()).padStart(2, '0')}</span></div>
                    
                    {currentData ? (
                        <div className={`relative w-full max-w-5xl mx-auto ${tearDirection === 'forward' ? 'tear-forward' : tearDirection === 'backward' ? 'tear-backward' : 'page-reveal'}`}>
                            <div className="flex flex-col lg:flex-row items-baseline gap-6 mb-16 ml-0 lg:ml-12 relative z-20">
                                <div className="font-playfair text-6xl lg:text-8xl font-black text-stone-900">{selectedDate.getDate()}<span className="text-2xl lg:text-3xl font-normal text-amber-700 ml-4 italic">{selectedDate.toLocaleString('en-US', { month: 'long' })}</span></div>
                                <div className="font-zen text-stone-500 text-lg">{selectedDate.toLocaleDateString('zh-TW', { weekday: 'long' })}</div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                                <div className="lg:col-span-4 relative lg:translate-x-4 z-10">
                                    <div className={`absolute top-1/2 -translate-y-1/2 right-0 w-[95%] aspect-square -z-10 transition-all duration-700 ease-in-out flex items-center justify-center ${isHoveringLink ? 'translate-x-[25%] opacity-100' : 'translate-x-0 opacity-0'}`}><IconDisc size="100%" isPureBlack={true} className="drop-shadow-[0_15px_35px_rgba(0,0,0,0.5)]" /></div>
                                    
                                    <div className="relative group">
                                        <div className="aspect-square w-full shadow-2xl relative bg-stone-800 overflow-hidden transition-transform duration-700 needle-drop z-10">
                                            {currentData.imageUrl ? <img src={currentData.imageUrl} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 flex items-center justify-center opacity-20"><IconDisc size={200} className="text-white" /></div>}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                            <div className="absolute bottom-0 left-0 p-6 w-full text-white"><p className="text-xs font-bold tracking-widest uppercase mb-1 text-amber-400">Now Playing</p><h2 className="text-2xl lg:text-3xl font-playfair italic leading-tight">{currentData.album}</h2><p className="text-base lg:text-lg mt-2 font-light tracking-wider">{currentData.artist}</p></div>
                                        </div>
                                        
                                        {/* Vinyl Mode 按鈕 */}
                                        {youtubeId && (
                                            <button 
                                                onClick={() => setIsImmersive(true)} 
                                                className="absolute -top-14 right-0 z-30 flex items-center gap-3 px-4 py-2 text-stone-500 hover:text-stone-800 text-sm font-bold tracking-[0.1em] transition-all duration-300 hover:scale-105 border-b-2 border-transparent hover:border-amber-600 font-zen"
                                            >
                                                <StoneVinylIcon size={24} />
                                                <span>進入黑膠模式</span>
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-6 grid grid-cols-1 gap-2" onMouseEnter={() => setIsHoveringLink(true)} onMouseLeave={() => setIsHoveringLink(false)}>
                                        {currentData.youtube && <a href={currentData.youtube} target="_blank" className="px-4 py-2.5 bg-red-800 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-red-700 transition-all hover:translate-x-1">YOUTUBE <IconArrowRight size={14}/></a>}
                                        {currentData.spotify && <a href={currentData.spotify} target="_blank" className="px-4 py-2.5 bg-green-800 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-green-700 transition-all hover:translate-x-1">SPOTIFY <IconArrowRight size={14}/></a>}
                                        {currentData.appleMusic && <a href={currentData.appleMusic} target="_blank" className="px-4 py-2.5 bg-stone-800 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-stone-700 transition-all hover:translate-x-1">APPLE MUSIC <IconArrowRight size={14}/></a>}
                                        {currentData.other && <a href={currentData.other} target="_blank" className="px-4 py-2.5 bg-slate-600 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-slate-500 transition-all hover:translate-x-1">OTHER <IconArrowRight size={14}/></a>}
                                    </div>
                                </div>
                                
                                <div className="lg:col-span-8 lg:pl-12">
                                    {currentData?.editorNote?.trim() && (
                                        <div className="mb-10 lg:hidden">
                                            <EditorNote note={currentData.editorNote} />
                                        </div>
                                    )}

                                    <IconQuote className="text-amber-600/20 mb-6" />
                                    <div className="prose prose-stone font-zen leading-relaxed text-stone-700 whitespace-pre-line text-lg">{currentData.content}</div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-64 opacity-30 text-center"><IconDisc size={64} className="mb-4" /><p className="font-zen text-xl tracking-widest uppercase">本日無資料</p></div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default App;