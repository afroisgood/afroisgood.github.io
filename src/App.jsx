import { useState, useEffect, useCallback, useMemo } from 'react';
import Papa from 'papaparse';

// 引入所有拆分出來的組件與工具
import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { Sidebar } from './components/Sidebar';
import { ImmersiveMode } from './components/ImmersiveMode';
import { ChangelogModal } from './components/ChangelogModal';
import { DailyArticle } from './components/DailyArticle';
import { EditorNote } from './components/EditorNote';
import { IconDisc } from './components/Icons';
// 【重要新增 1】：引入占卜組件
import { JazzFortune } from './components/JazzFortune'; 

const App = () => {
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [jazzData, setJazzData] = useState({});
    const [changelogData, setChangelogData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [tearDirection, setTearDirection] = useState(null);
    const [showChangelog, setShowChangelog] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    
    const SHEET_BASE_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRHKaZyF61C3xBsReTpqR7f4_acrKWq6QIyDadZ3t2P_NkhmBh9hgCJF0tLwjrXqXVmMl14YF3BUC_b/pub?output=csv";
    const DATA_URL = `${SHEET_BASE_URL}&gid=1417154704`;
    const LOG_URL = `${SHEET_BASE_URL}&gid=647085179`;

    const genreColors = { "Bebop": "#FDE68A", "Cool Jazz": "#BFDBFE", "Fusion": "#DDD6FE", "Swing": "#FECACA", "Hard Bop": "#FED7AA", "Free Jazz": "#E2E8F0" };
    const formatDateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const dateKey = formatDateString(selectedDate);
    const currentData = jazzData[dateKey];
    
    useEffect(() => {
        if (currentData && currentData.album && currentData.artist) {
            const month = selectedDate.getMonth() + 1;
            const day = selectedDate.getDate();
            document.title = `${month}月${day}日 | ${currentData.album} - ${currentData.artist}`;
        } else {
            document.title = '日めくりジャズ365 | 2026年版';
        }
    }, [selectedDate, currentData]);

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
        if (player && typeof player.pauseVideo === 'function') player.pauseVideo();
        setIsImmersive(false);
    };

    const triggerTransition = (newDate) => {
        if (player && playerState === 1 && typeof player.pauseVideo === 'function') player.pauseVideo();
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
            
            <ImmersiveMode 
                isImmersive={isImmersive} handleCloseImmersive={handleCloseImmersive} selectedDate={selectedDate}
                togglePlay={togglePlay} handlePrevDay={handlePrevDay} handleNextDay={handleNextDay}
                youtubeId={youtubeId} currentData={currentData} isVinylSpinning={isVinylSpinning}
            />
            <ChangelogModal 
                showChangelog={showChangelog} setShowChangelog={setShowChangelog} changelogData={changelogData} 
            />

            <div className="max-w-[1400px] mx-auto min-h-screen grid grid-cols-1 lg:grid-cols-12 gap-0 relative">
                
                <Sidebar 
                    isPlaying={isPlaying} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
                    selectedDate={selectedDate} handleDateChange={handleDateChange} jazzData={jazzData}
                    setShowChangelog={setShowChangelog} latestVersion={latestVersion}
                />
                
                <div className="lg:col-span-9 relative p-6 lg:p-12 flex flex-col justify-start pt-20 lg:pt-32 min-h-screen">
                    {currentData?.editorNote?.trim() && (
                        <div className="absolute top-12 right-12 z-40 max-w-[300px] hidden lg:block">
                            <EditorNote note={currentData.editorNote} />
                        </div>
                    )}

                    <div className="absolute top-0 right-0 lg:right-20 -z-10 select-none opacity-5 pointer-events-none">
                        <span className="font-playfair text-[20rem] lg:text-[25rem] leading-none text-stone-900">
                            {String(selectedDate.getDate()).padStart(2, '0')}
                        </span>
                    </div>
                    
                    <DailyArticle 
                        currentData={currentData} 
                        selectedDate={selectedDate} 
                        tearDirection={tearDirection}
                        youtubeId={youtubeId} 
                        setIsImmersive={setIsImmersive}
                    />



                </div>
            </div>
        </div>
    );
};

export default App;