// src/App.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { formatDateString, isDateVisible } from './utils/dateUtils';
import { resolveMoodHex } from './utils/moodColors';
import { Sidebar } from './components/Sidebar';
import { ImmersiveMode } from './components/ImmersiveMode';
import { ChangelogModal } from './components/ChangelogModal';
import { DailyArticle } from './components/DailyArticle';
import { EditorNote } from './components/EditorNote';
import { IconDisc, IconPlay, IconPause, IconX, IconMaximize } from './components/Icons';
import { AdminPanel } from './components/AdminPanel';
import { MobileNav } from './components/MobileNav';
import { RetroMenuBar } from './components/RetroMenuBar';
import { RetroTitleBar } from './components/RetroTitleBar';
import { IntroCalendar } from './components/IntroCalendar';
import { ArticleSkeleton } from './components/ArticleSkeleton';

const hexToMoodVars = (hex) => {
    const def = { accent: 'rgb(180,83,9)', glow: 'rgb(245,158,11)' };
    if (!hex || !hex.startsWith('#') || hex.length < 7) return def;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const ac = (f) => Math.round(Math.min(255, r * f)) + ',' + Math.round(Math.min(255, g * f)) + ',' + Math.round(Math.min(255, b * f));
    return { accent: `rgb(${ac(0.38)})`, glow: `rgb(${ac(0.78)})` };
};

const getYouTubeVideoId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

const parseHashDate = () => {
    const hash = window.location.hash.replace('#', '');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(hash)) return null;
    const [y, m, d] = hash.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return isNaN(date) ? null : date;
};

// 開場動畫：每個分頁第一次進站播日曆翻頁，之後改用骨架直入；減少動態效果者一律略過
const INTRO_SEEN_KEY = 'jazz365_intro_seen';
const getIntroMode = () => {
    try {
        if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return 'reduced';
        if (sessionStorage.getItem(INTRO_SEEN_KEY)) return 'skeleton';
    } catch { /* 無痕模式等無法存取 sessionStorage 時，照常播開場 */ }
    return 'calendar';
};

// ── 主應用（所有 hooks 都在此，無條件式 early return）──
const MainApp = () => {
    const [selectedDate, setSelectedDate] = useState(() => parseHashDate() || new Date());
    const [currentMonth, setCurrentMonth] = useState(() => { const t = parseHashDate() || new Date(); return new Date(t.getFullYear(), t.getMonth(), 1); });
    const [jazzData, setJazzData] = useState({});
    const [changelogData, setChangelogData] = useState([]);
    const [dataReady, setDataReady] = useState(false);
    const [introMode] = useState(getIntroMode);
    const [introTargetDate] = useState(selectedDate);
    const [showIntro, setShowIntro] = useState(introMode === 'calendar');
    const [tearDirection, setTearDirection] = useState(null);
    const [showChangelog, setShowChangelog] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const dateKey = formatDateString(selectedDate);

    const visibleJazzData = useMemo(() => {
        const result = {};
        Object.keys(jazzData).forEach(k => {
            if (isDateVisible(k)) result[k] = jazzData[k];
        });
        return result;
    }, [jazzData]);

    const currentData = visibleJazzData[dateKey];

    const moodHex = resolveMoodHex(currentData?.mood);
    const { accent: moodAccent, glow: moodGlow } = hexToMoodVars(moodHex);

    const youtubeId = useMemo(() => getYouTubeVideoId(currentData?.youtube), [currentData]);

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
            const image = currentData.imageUrl
                ? currentData.imageUrl
                : youtubeId ? 'https://img.youtube.com/vi/' + youtubeId + '/maxresdefault.jpg'
                : defaultImage;
            setMeta(title, desc, image, siteBase + '/#' + dateKey);
        } else {
            setMeta(defaultTitle, defaultDesc, defaultImage, siteBase + '/');
        }
    }, [selectedDate, currentData, youtubeId]);

    const { player, playerState, playerError } = useYouTubePlayer((isImmersive || isMinimized) ? youtubeId : null);
    const isVinylSpinning = playerState === 1 || playerState === 3;

    // Refs：讓事件監聽器永遠讀到最新值，避免 stale closure 造成切換第三個日期失敗
    const selectedDateRef = useRef(selectedDate);
    selectedDateRef.current = selectedDate;
    const playerRef2 = useRef(player);
    playerRef2.current = player;
    const playerStateRef2 = useRef(playerState);
    playerStateRef2.current = playerState;
    const triggerTransitionRef = useRef(null);

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
    const togglePlayRef = useRef(togglePlay);
    togglePlayRef.current = togglePlay;

    // 空 deps：只註冊一次，透過 ref 永遠讀到最新狀態
    useEffect(() => {
        const handleHashChange = () => {
            const hashDate = parseHashDate();
            if (hashDate && formatDateString(hashDate) !== formatDateString(selectedDateRef.current)) {
                triggerTransitionRef.current(hashDate);
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

            switch (e.key) {
                case 'Escape':
                    if (isImmersive) {
                        isMinimized ? handleCloseImmersive() : handleMinimizeImmersive();
                    }
                    break;
                case 'ArrowLeft':
                    if (!tearDirection) {
                        e.preventDefault();
                        const prev = new Date(selectedDateRef.current);
                        prev.setDate(prev.getDate() - 1);
                        window.location.hash = formatDateString(prev);
                    }
                    break;
                case 'ArrowRight':
                    if (!tearDirection) {
                        e.preventDefault();
                        const next = new Date(selectedDateRef.current);
                        next.setDate(next.getDate() + 1);
                        window.location.hash = formatDateString(next);
                    }
                    break;
                case 'i':
                case 'I':
                    if (!isImmersive && youtubeId) setIsImmersive(true);
                    break;
                case ' ':
                    if (isImmersive || isMinimized) {
                        e.preventDefault();
                        togglePlayRef.current();
                    }
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isImmersive, isMinimized, tearDirection, youtubeId]);

    const handleCloseImmersive = () => {
        const p = playerRef2.current;
        if (p && typeof p.pauseVideo === 'function') p.pauseVideo();
        setIsImmersive(false);
        setIsMinimized(false);
    };

    const handleMinimizeImmersive = () => {
        setIsMinimized(true);
    };

    const handleExpandImmersive = () => {
        setIsMinimized(false);
    };

    const triggerTransition = (newDate) => {
        try {
            const p = playerRef2.current;
            if (p && playerStateRef2.current === 1 && typeof p.pauseVideo === 'function') p.pauseVideo();
        } catch (_) {}
        const direction = newDate > selectedDateRef.current ? 'forward' : 'backward';
        setTearDirection(direction);
        setTimeout(() => {
            setSelectedDate(newDate);
            setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
            setTearDirection(null);
        }, 850);
    };
    triggerTransitionRef.current = triggerTransition;

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
            try {
                const res = await fetch('/data.json');
                const data = await res.json();
                const arr = Array.isArray(data) ? data : (data.entries || []);
                const cl  = Array.isArray(data) ? [] : (data.changelog || []);
                const map = {};
                arr.forEach(row => { if (row.date) map[row.date.trim()] = row; });
                setJazzData(map);
                setChangelogData(cl.slice().sort((a, b) => b.date.localeCompare(a.date)));
            } catch (_) {}
            setDataReady(true);
        };
        fetchAllData();
    }, []);

    useEffect(() => {
        if (introMode !== 'calendar') return;
        try { sessionStorage.setItem(INTRO_SEEN_KEY, '1'); } catch { /* 寫不進去就下次再播一次，無妨 */ }
    }, [introMode]);

    const handleIntroDone = useCallback(() => setShowIntro(false), []);

    const latestVersion = changelogData[0]?.version || "v1.0.0";

    const winTitle = currentData
        ? `${String(selectedDate.getDate()).padStart(2,'0')} ${selectedDate.toLocaleDateString('en-US',{month:'short'}).toUpperCase()} — ${(currentData.song||'').toUpperCase().slice(0,38)}${(currentData.song||'').length>38?'...':''}`
        : 'DAILY JAZZ ALMANAC';

    return (
        <div className="retro-desktop min-h-screen font-sans text-stone-800 relative overflow-x-hidden"
             style={{ '--mood-accent': moodAccent, '--mood-glow': moodGlow }}>

            {showIntro && (
                <IntroCalendar targetDate={introTargetDate} ready={dataReady} onDone={handleIntroDone} />
            )}

            <RetroMenuBar />

            {(isImmersive || isMinimized) && youtubeId && (
                <div style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none', bottom: 0, left: 0, overflow: 'hidden' }}>
                    <div id="yt-player-mount" style={{ width: '100%', height: '100%' }}></div>
                </div>
            )}

            <ImmersiveMode
                isImmersive={isImmersive} isMinimized={isMinimized}
                handleCloseImmersive={handleCloseImmersive} handleMinimizeImmersive={handleMinimizeImmersive}
                selectedDate={selectedDate} togglePlay={togglePlay}
                handlePrevDay={handlePrevDay} handleNextDay={handleNextDay}
                currentData={currentData} isVinylSpinning={isVinylSpinning}
                playerError={playerError}
            />

            {isImmersive && isMinimized && (
                <div
                    className="fixed left-0 right-0 z-[300] flex items-center gap-3 px-4 py-2 bottom-14 lg:bottom-0"
                    style={{ background: 'rgba(18,13,10,0.96)', borderTop: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(8px)' }}
                >
                    <div className={`w-10 h-10 rounded-full overflow-hidden border border-stone-700 flex-shrink-0 ${isVinylSpinning ? 'animate-spin-vinyl' : ''}`}>
                        {currentData?.imageUrl ? (
                            <img src={currentData.imageUrl} className="w-full h-full object-cover" alt="" />
                        ) : (
                            <div className="w-full h-full bg-stone-800 flex items-center justify-center">
                                <IconDisc size={24} className="text-stone-600" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <p className="text-stone-100 truncate" style={{ fontSize: '11px', fontFamily: "'Courier New', monospace", fontWeight: 'bold', letterSpacing: '0.06em' }}>
                            {currentData?.song || currentData?.album || '—'}
                        </p>
                        <p className="text-amber-500/70 truncate" style={{ fontSize: '10px', letterSpacing: '0.04em' }}>
                            {currentData?.artist}
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={togglePlay}
                            className="flex items-center justify-center rounded-full bg-stone-700 hover:bg-stone-600 text-stone-200 transition-colors"
                            style={{ width: 32, height: 32 }}
                            title={isVinylSpinning ? '暫停' : '播放'}
                        >
                            {isVinylSpinning ? <IconPause size={13} /> : <IconPlay size={13} />}
                        </button>
                        <button
                            onClick={handleExpandImmersive}
                            className="flex items-center justify-center rounded-full bg-stone-700 hover:bg-stone-600 text-stone-200 transition-colors"
                            style={{ width: 32, height: 32 }}
                            title="展開"
                        >
                            <IconMaximize size={13} />
                        </button>
                        <button
                            onClick={handleCloseImmersive}
                            className="flex items-center justify-center rounded-full bg-stone-800 hover:bg-stone-700 text-stone-500 hover:text-stone-300 transition-colors"
                            style={{ width: 32, height: 32 }}
                            title="關閉"
                        >
                            <IconX size={13} />
                        </button>
                    </div>
                </div>
            )}

            <ChangelogModal
                showChangelog={showChangelog} setShowChangelog={setShowChangelog} changelogData={changelogData}
            />

            <MobileNav
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                handleDateChange={handleDateChange}
                handlePrevDay={handlePrevDay}
                handleNextDay={handleNextDay}
                jazzData={visibleJazzData}
                isVinylSpinning={isVinylSpinning}
            />

            <div className={`max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 relative ${introMode === 'skeleton' ? 'shell-enter' : ''}`}
                 style={{ padding: '4px 12px 12px', paddingTop: '28px', paddingBottom: isMinimized ? '120px' : undefined }}>

                <Sidebar
                    isVinylSpinning={isVinylSpinning}
                    currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
                    selectedDate={selectedDate} handleDateChange={handleDateChange} jazzData={visibleJazzData}
                    setShowChangelog={setShowChangelog} latestVersion={latestVersion}
                />

                <div className="lg:col-span-9 relative retro-win" style={{ alignSelf: 'flex-start', minHeight: '600px' }}>

                    <RetroTitleBar
                        title={winTitle}
                        className="hidden lg:flex"
                        style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                    />

                    <div className="retro-body relative overflow-hidden" style={{ padding: '36px 56px 40px', paddingBottom: '96px', backgroundColor: moodHex, transition: 'background-color 0.8s ease' }}>

                        {currentData?.imageUrl && (
                            <div
                                key={currentData.imageUrl}
                                aria-hidden="true"
                                className="absolute inset-0 pointer-events-none album-ambient-bg"
                                style={{
                                    backgroundImage: `url(${currentData.imageUrl})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    filter: 'blur(60px) saturate(1.8) brightness(0.6)',
                                    transform: 'scale(1.4)',
                                    zIndex: 0,
                                }}
                            />
                        )}

                        <div className="relative" style={{ zIndex: 1 }}>

                            <div className="absolute top-0 right-0 lg:right-16 -z-10 select-none pointer-events-none" style={{ opacity: 0.03 }}>
                                <span className="font-playfair leading-none text-stone-900" style={{ fontSize: 'clamp(10rem, 20vw, 22rem)' }}>
                                    {String(selectedDate.getDate()).padStart(2, '0')}
                                </span>
                            </div>

                            {dataReady ? (
                                <DailyArticle
                                    key={dateKey}
                                    currentData={currentData}
                                    selectedDate={selectedDate}
                                    tearDirection={tearDirection}
                                    youtubeId={youtubeId}
                                    setIsImmersive={setIsImmersive}
                                />
                            ) : (
                                <ArticleSkeleton />
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

// ── App：只負責 admin 路由，不含任何 hooks 在 early return 之後 ──
const App = () => {
    const [isAdmin, setIsAdmin] = useState(window.location.hash === '#admin');

    useEffect(() => {
        const onHash = () => setIsAdmin(window.location.hash === '#admin');
        window.addEventListener('hashchange', onHash);
        return () => window.removeEventListener('hashchange', onHash);
    }, []);

    return isAdmin ? <AdminPanel /> : <MainApp />;
};

export default App;
