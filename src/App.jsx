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
import { MobileNav } from './components/MobileNav';
import { RetroMenuBar } from './components/RetroMenuBar';

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
    const [changelogData, setChangelogData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [tearDirection, setTearDirection] = useState(null);
    const [showChangelog, setShowChangelog] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    
    const genreColors = { "Bebop": "#FDE68A", "Cool Jazz": "#BFDBFE", "Fusion": "#DDD6FE", "Swing": "#FECACA", "Hard Bop": "#FED7AA", "Free Jazz": "#E2E8F0" };
    const formatDateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const dateKey = formatDateString(selectedDate);
    const currentData = jazzData[dateKey];

    // Mood 衍生色（必須在 currentData 之後計算）
    const hexToMoodVars = (hex) => {
        const def = { accent: 'rgb(180,83,9)', glow: 'rgb(245,158,11)' };
        if (!hex || !hex.startsWith('#') || hex.length < 7) return def;
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        const ac = (f) => Math.round(Math.min(255, r * f)) + ',' + Math.round(Math.min(255, g * f)) + ',' + Math.round(Math.min(255, b * f));
        return { accent: `rgb(${ac(0.38)})`, glow: `rgb(${ac(0.78)})` };
    };
    const moodHex = genreColors[currentData?.mood?.trim()] || (currentData?.mood?.startsWith('#') ? currentData.mood : null) || '#f2f0e9';
    const { accent: moodAccent, glow: moodGlow } = hexToMoodVars(moodHex);
    
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
                const data = await res.json();
                // 支援新格式 { entries, changelog } 或舊格式（純陣列）
                const arr = Array.isArray(data) ? data : (data.entries || []);
                const cl  = Array.isArray(data) ? [] : (data.changelog || []);
                const map = {};
                arr.forEach(row => { if (row.date) map[row.date.trim()] = row; });
                setJazzData(map);
                setChangelogData(cl.slice().sort((a, b) => b.date.localeCompare(a.date)));
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
        <div className="retro-desktop min-h-screen flex flex-col items-center justify-center p-6 text-center">
            <div className="retro-win" style={{ width: '480px', maxWidth: '90vw' }}>
                <div className="retro-titlebar" style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span className="retro-ctrl">&#215;</span>
                    <span className="retro-ctrl">&#8722;</span>
                    <span className="retro-ctrl">&#9633;</span>
                    <span style={{ flex: 1, textAlign: 'center', fontSize: '13px', letterSpacing: '0.18em' }}>DAILY JAZZ ALMANAC</span>
                </div>
                <div className="retro-body" style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
                    <IconDisc className="animate-spin-fast" size={64} style={{ color: '#7a5840', opacity: 0.7 }} />
                    <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '13px', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#3a2010', lineHeight: 1.8 }}>
                        JAZZ，是一種帶著焦臭味<br />撲面而來的文字
                    </p>
                    <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '11px', color: '#8a6848', letterSpacing: '0.25em' }}>
                        — 平岡正明
                    </p>
                    <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '10px', color: '#b09878', letterSpacing: '0.2em', marginTop: '4px', opacity: 0.7 }}>
                        Loading…
                    </p>
                </div>
            </div>
        </div>
    );
    
    const latestVersion = changelogData[0]?.version || "v1.0.0";

    const winTitle = currentData
        ? `${String(selectedDate.getDate()).padStart(2,'0')} ${selectedDate.toLocaleDateString('en-US',{month:'short'}).toUpperCase()} \u2014 ${(currentData.song||'').toUpperCase().slice(0,38)}${(currentData.song||'').length>38?'...':''}`
        : 'DAILY JAZZ ALMANAC';

    return (
        <div className="retro-desktop min-h-screen font-sans text-stone-800 relative overflow-x-hidden"
             style={{ '--mood-accent': moodAccent, '--mood-glow': moodGlow }}>

            {/* Fixed top menu bar */}
            <RetroMenuBar />

            <ImmersiveMode
                isImmersive={isImmersive} handleCloseImmersive={handleCloseImmersive} selectedDate={selectedDate}
                togglePlay={togglePlay} handlePrevDay={handlePrevDay} handleNextDay={handleNextDay}
                youtubeId={youtubeId} currentData={currentData} isVinylSpinning={isVinylSpinning}
            />
            <ChangelogModal
                showChangelog={showChangelog} setShowChangelog={setShowChangelog} changelogData={changelogData}
            />

            {/* Mobile bottom nav */}
            <MobileNav
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                handleDateChange={handleDateChange}
                handlePrevDay={handlePrevDay}
                handleNextDay={handleNextDay}
                jazzData={jazzData}
                isPlaying={isPlaying}
            />

            {/* Desktop layout: two floating windows on the pink desktop */}
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 relative"
                 style={{ padding: '4px 12px 12px', paddingTop: '28px' }}>

                <Sidebar
                    isPlaying={isPlaying} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
                    selectedDate={selectedDate} handleDateChange={handleDateChange} jazzData={jazzData}
                    setShowChangelog={setShowChangelog} latestVersion={latestVersion}
                />

                {/* Main content window */}
                <div className="lg:col-span-9 relative retro-win" style={{ alignSelf: 'flex-start', minHeight: '600px' }}>

                    {/* Window title bar — desktop only */}
                    <div className="hidden lg:flex retro-titlebar" style={{ alignItems: 'center', gap: '7px' }}>
                        <span className="retro-ctrl">&#215;</span>
                        <span className="retro-ctrl">&#8722;</span>
                        <span className="retro-ctrl">&#9633;</span>
                        <span style={{ flex: 1, textAlign: 'center', fontSize: '12px', letterSpacing: '0.12em', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                            {winTitle}
                        </span>
                    </div>

                    {/* Window body */}
                    <div className="retro-body relative" style={{ padding: '36px 56px 40px', paddingBottom: '96px' }}>

                        {/* Editor note — desktop top-right */}
                        {currentData?.editorNote?.trim() && (
                            <div className="absolute top-8 right-8 z-40 max-w-[280px] hidden lg:block">
                                <EditorNote note={currentData.editorNote} />
                            </div>
                        )}

                        {/* Ghost date watermark */}
                        <div className="absolute top-0 right-0 lg:right-16 -z-10 select-none pointer-events-none" style={{ opacity: 0.03 }}>
                            <span className="font-playfair leading-none text-stone-900" style={{ fontSize: 'clamp(10rem, 20vw, 22rem)' }}>
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
        </div>
    );
};

export default App;