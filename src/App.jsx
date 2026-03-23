// src/App.jsx
import { useState, useEffect, useCallback, useMemo } from 'react';

import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { Sidebar } from './components/Sidebar';
import { ImmersiveMode } from './components/ImmersiveMode';
import { ChangelogModal } from './components/ChangelogModal';
import { DailyArticle } from './components/DailyArticle';
import { EditorNote } from './components/EditorNote';
import { IconDisc } from './components/Icons';
import { AdminPanel } from './components/AdminPanel';

const App = () => {
    const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin');

    useEffect(() => {
        const onHash = () => setIsAdmin(window.location.hash === '#admin');
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    if (isAdmin) return <AdminPanel />;

    // 【所有資料與播放邏輯保留 1.3.0 穩定版】
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
    const [jazzData, setJazzData] = useState({});
    const [changelogData] = useState([
        { version: "v1.3.0", date: "2026-03-23", content: "後台管理系統上線，支援直接編輯資料。\n加入 Random Explore 隨機探索功能。\n復古爵士海報字型裝飾。" },
        { version: "v1.2.0", date: "2026-02-01", content: "Open Graph 社群分享預覽圖。\n沉浸模式優化。" },
        { version: "v1.1.0", date: "2026-01-15", content: "版面重整，新增專輯封面大圖區塊。\n空白頁「本日無資料」設計更新。" },
        { version: "v1.0.0", date: "2026-01-01", content: "日めくりジャズ365 正式上線。" },
    ]);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [tearDirection, setTearDirection] = useState(null);
    const [showChangelog, setShowChangelog] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    
    const genreColors = { "Bebop": "#FDE68A", "Cool Jazz": "#BFDBFE", "Fusion": "#DDD6FE", "Swing": "#FECACA", "Hard Bop": "#FED7AA", "Free Jazz": "#E2E8F0" };
    const formatDateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const dateKey = formatDateString(selectedDate);
    const currentData = jazzData[dateKey];
    
    useEffect(() => {
        const siteBase = 'https://afroisgood.github.io';
        const defaultTitle = '日めくりジャズ365 | 2026年版';
        const defaultDesc = '每天一張爵士唱片推薦，365 天不間斷。Daily Jazz Almanac 2026。';
        const defaultImage = siteBase + '/og-image.png';

        const setMeta = (title, desc, image, url) => {
            document.title = title;
            const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.setAttribute('content', val); };
            set('meta[property="og:title"]', title);
            set('meta[property="og:description"]', desc);
            set('meta[property="og:image"]', image);
            set('meta[property="og:url"]', url);
            set('meta[name="twitter:title"]', title);
            set('meta[name="twitter:description"]', desc);
            set('meta[name="twitter:image"]', image);
            set('meta[name="twitter:url"]', url);
            set('meta[name="description"]', desc);
        };

        if (currentData && currentData.album && currentData.artist) {
            const month = selectedDate.getMonth() + 1;
            const day = selectedDate.getDate();
            const title = month + '月' + day + '日 | ' + currentData.album + ' - ' + currentData.artist;
            const desc = currentData.content
                ? currentData.content.slice(0, 80) + '...'
                : currentData.artist + ' - ' + currentData.album;
            const yId = getYouTubeVideoId(currentData.youtube);
            const image = currentData.imageUrl
                ? currentData.imageUrl
                : yId ? 'https://img.youtube.com/vi/' + yId + '/maxresdefault.jpg'
                : defaultImage;
            setMeta(title, desc, image, siteBase + '/#' + dateKey);
        } else {
            setMeta(defaultTitle, defaultDesc, defaultImage, siteBase + '/');
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
            // 從 data.json 讀取所有資料（單一資料來源）
            try {
                const res = await fetch('/data.json');
                const arr = await res.json();
                if (Array.isArray(arr)) {
                    const map = {};
                    arr.forEach(row => { if (row.date) map[row.date.trim()] = row; });
                    setJazzData(map);
                }
            } catch (_) { /* 靜默忽略 */ }

            const hash = window.location.hash.replace('#', '');
            if (hash && /^\d{4}-\d{2}-\d{2}$/.test(hash)) {
                const [y, m, d] = hash.split('-').map(Number);
                const initialDate = new Date(y, m - 1, d);
                setSelectedDate(initialDate);
                setCurrentMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
            }

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
                
                {/* 🌟 核心修正：大幅減少 pt-20 lg:pt-32 的上邊距，讓內容上移。石編的話(absolute)不會受影響。 */}
                <div className="lg:col-span-9 relative p-6 lg:p-12 flex flex-col justify-start pt-4 lg:pt-8 min-h-screen">
                    
                    {/* 石編的話依然錨定在右上角角落 (absolute top-12 right-12) */}
                    {currentData?.editorNote?.trim() && (
                        <div className="absolute top-12 right-12 z-40 max-w-[300px] hidden lg:block">
                            <EditorNote note={currentData.editorNote} />
                        </div>
                    )}

                    <div className="absolute top-0 right-0 lg:right-20 -z-10 select-none opacity-[0.04] pointer-events-none">
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