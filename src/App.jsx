// src/App.jsx
import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';

import { useYouTubePlayer } from './hooks/useYouTubePlayer';
import { FIRST_YEAR, formatDateString, isDateVisible, lastYearDateString } from './utils/dateUtils';
import { resolveMoodHex } from './utils/moodColors';
import { Sidebar } from './components/Sidebar';
import { ImmersiveMode } from './components/ImmersiveMode';
import { ChangelogModal } from './components/ChangelogModal';
import { ShortcutsModal } from './components/ShortcutsModal';
import { PageSheet } from './components/PageSheet';
import { EditorNote } from './components/EditorNote';
import { IconDisc, IconPlay, IconPause, IconX, IconMaximize } from './components/Icons';
import { AdminPanel } from './components/AdminPanel';
import { MobileNav } from './components/MobileNav';
import { RetroMenuBar } from './components/RetroMenuBar';
import { RetroTitleBar } from './components/RetroTitleBar';
import { IntroCalendar } from './components/IntroCalendar';
import { MonthWall } from './components/MonthWall';

// 唱片行（探索模式）用到才載入，只看每日推薦的人不必多下載
const ShopMode = lazy(() => import('./explore/ShopMode'));

const SHEET_TEAR_MS = 520; // 與 index.css 的 .page-sheet--tear / --drop 動畫時長一致

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

// 首頁入口上次選的模式，下次進站預先選好
const HOME_MODE_KEY = 'jazz365_home_mode';
const getHomeMode = () => {
    try { return localStorage.getItem(HOME_MODE_KEY) === 'shop' ? 'shop' : 'day'; } catch { return 'day'; }
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
    // 網址沒有指定日期（從首頁進站）時，開場日曆停在今天讓讀者選日曆模式或唱片行模式；分享連結直接看那天
    const [chooseOnEntry] = useState(() => !parseHashDate());
    const [homeMode] = useState(getHomeMode);
    const [showIntro, setShowIntro] = useState(introMode === 'calendar' || chooseOnEntry);
    const [leavingSheets, setLeavingSheets] = useState([]); // 正在撕走（或被蓋住）的舊頁
    const [enterDirection, setEnterDirection] = useState(null); // 帶入目前這頁的方向；null = 尚未換過日期
    const sheetSeqRef = useRef(0);
    const [showChangelog, setShowChangelog] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [viewMode, setViewMode] = useState('day'); // 'day' 單日頁 | 'wall' 月份唱片牆 | 'shop' 唱片行
    const [shopOpened, setShopOpened] = useState(false); // 進過唱片行就一直掛著，切回來時角色位置和翻到的唱片都還在
    const [backToShop, setBackToShop] = useState(false); // 從唱片行「閱讀這天」過來，單日頁顯示回到唱片行
    const [shopDeckOpen, setShopDeckOpen] = useState(false); // 唱片行的唱盤畫面開著（播放控制在那裡，迷你播放器先藏起來）

    const dateKey = formatDateString(selectedDate);

    const visibleJazzData = useMemo(() => {
        const result = {};
        Object.keys(jazzData).forEach(k => {
            if (isDateVisible(k)) result[k] = jazzData[k];
        });
        return result;
    }, [jazzData]);

    const currentData = visibleJazzData[dateKey];
    const lastYearOf = (date) => {
        const key = lastYearDateString(date);
        return visibleJazzData[key] && { date: key, ...visibleJazzData[key] };
    };

    const moodHex = resolveMoodHex(currentData?.mood);
    const { accent: moodAccent, glow: moodGlow } = hexToMoodVars(moodHex);

    const youtubeId = useMemo(() => getYouTubeVideoId(currentData?.youtube), [currentData]);

    useEffect(() => {
        const siteBase = 'https://jazzcalender365.com';
        const defaultTitle = 'JAZZ 365 | Daily Jazz Almanac';
        const defaultDesc = '每天一張爵士唱片推薦，365 天不間斷。Daily Jazz Almanac。';
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
            const desc = month + '月' + day + '日的爵士推薦：' + currentData.artist + '《' + currentData.album + '》';
            const image = currentData.imageUrl
                ? currentData.imageUrl
                : youtubeId ? 'https://img.youtube.com/vi/' + youtubeId + '/maxresdefault.jpg'
                : defaultImage;
            setMeta(title, desc, image, siteBase + '/' + dateKey.replaceAll('-', '/') + '/');
        } else {
            setMeta(defaultTitle, defaultDesc, defaultImage, siteBase + '/');
        }
    }, [selectedDate, currentData, youtubeId]);

    // 唱片行裡先把播放器建好、載入影片但不播放：按「放上唱盤」時要在點擊當下開始播放，iPhone Safari 才會出聲。
    // 暖機用當天的影片，當天沒有就用最新一張有試聽的。
    const playerActive = isImmersive || isMinimized;
    const shopWarmId = useMemo(() => {
        if (viewMode !== 'shop') return null;
        if (youtubeId) return youtubeId;
        const latest = Object.keys(visibleJazzData).sort().reverse().find(k => getYouTubeVideoId(visibleJazzData[k].youtube));
        return latest ? getYouTubeVideoId(visibleJazzData[latest].youtube) : null;
    }, [viewMode, youtubeId, visibleJazzData]);
    const playerVideoId = playerActive ? youtubeId : shopWarmId;
    const { player, playerState, playerError, playNow } = useYouTubePlayer(playerVideoId, { autoplay: playerActive });
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
            // 緩衝中（3）按鈕顯示的也是「暫停」，所以兩種狀態都要當成播放中處理
            if (playerState === 1 || playerState === 3) {
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
                    // 唱片行裡 Esc 留給「把唱片放回去」，不要順手關掉迷你播放器
                    if (viewMode === 'shop' && isMinimized) break;
                    if (isImmersive) {
                        isMinimized ? handleCloseImmersive() : handleMinimizeImmersive();
                    }
                    break;
                case 'ArrowLeft': {
                    if (viewMode === 'shop' && !(isImmersive && !isMinimized)) break; // 唱片行裡方向鍵用來走路
                    e.preventDefault();
                    const prev = new Date(selectedDateRef.current);
                    prev.setDate(prev.getDate() - 1);
                    window.location.hash = formatDateString(prev);
                    break;
                }
                case 'ArrowRight': {
                    if (viewMode === 'shop' && !(isImmersive && !isMinimized)) break;
                    e.preventDefault();
                    const next = new Date(selectedDateRef.current);
                    next.setDate(next.getDate() + 1);
                    window.location.hash = formatDateString(next);
                    break;
                }
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
    }, [isImmersive, isMinimized, youtubeId, viewMode]);

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

    // keepPlaying：唱片行放上唱盤時，音樂已經在點擊當下開始播了，換日期不要把它停掉
    const triggerTransition = (newDate, { keepPlaying = false } = {}) => {
        if (!keepPlaying) {
            try {
                const p = playerRef2.current;
                if (p && playerStateRef2.current === 1 && typeof p.pauseVideo === 'function') p.pauseVideo();
            } catch (_) {}
        }
        const prevDate = selectedDateRef.current;
        // 先更新 ref：接著改網址觸發的 hashchange 若比重新渲染早到，才不會把同一天再換一次
        selectedDateRef.current = newDate;
        const direction = newDate > prevDate ? 'forward' : 'backward';

        // 新頁立刻換上；舊頁留一張快照做動畫：往後翻時蓋在上面撕走，往前翻時墊在下面讓新頁落下來蓋住。
        // 連按時同方向的舊頁會一張張疊上去，換方向就直接清掉，避免同一天同時在撕走又在落下。
        if (dataReady) {
            const id = ++sheetSeqRef.current;
            const sheet = { id, direction, date: prevDate, data: visibleJazzData[formatDateString(prevDate)] };
            setLeavingSheets(prev => [...prev.filter(s => s.direction === direction), sheet]);
            setTimeout(() => setLeavingSheets(prev => prev.filter(s => s.id !== id)), SHEET_TEAR_MS + 80);
        }
        // 讀到文章下方再換日期時捲回頂部，新的一天從標題開始讀
        if (window.scrollY > 0) window.scrollTo(0, 0);
        setEnterDirection(direction);
        setSelectedDate(newDate);
        setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1));
    };
    triggerTransitionRef.current = triggerTransition;

    const handleDateChange = (newDate) => {
        window.location.hash = formatDateString(newDate);
    };

    // 唱片行按下「放上唱盤」的當下（還在點擊事件裡）：用預先建好的播放器直接開始播這張
    const handleShopStart = (record) => {
        playNow(getYouTubeVideoId(record.youtube));
    };

    // 唱片行過場播完：換到這張的日期、以縮小狀態播放（畫面停在唱片行的唱盤上，回到店裡時底部是迷你播放器），
    // 不跳進沉浸模式；播放器已經在播這張的話就接著播，不會重來。
    // auto：連續播放自動換下一張，只換日期，播放器原本是縮小還是展開都不動
    const handleShopPlay = (record, { auto = false } = {}) => {
        const [y, m, d] = record.date.split('-').map(Number);
        if (record.date !== dateKey) triggerTransition(new Date(y, m - 1, d), { keepPlaying: true });
        window.location.hash = record.date;
        if (auto) return;
        setIsImmersive(true);
        setIsMinimized(true);
    };

    const handleShopRead = (record) => {
        const [y, m, d] = record.date.split('-').map(Number);
        setViewMode('day');
        setBackToShop(true);
        handleDateChange(new Date(y, m - 1, d));
        window.scrollTo(0, 0);
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

    // 資料每年一個檔案（public/data/2026.json…），看到哪一年才載入哪一年；
    // 同一年只抓一次，回傳同一個 promise。還沒有資料的年份（404）就當作空的。
    const yearLoadsRef = useRef({});
    const loadYear = useCallback((year) => {
        if (year < FIRST_YEAR) return Promise.resolve();
        yearLoadsRef.current[year] ??= fetch(`/data/${year}.json`)
            .then(res => (res.ok ? res.json() : []))
            .then(rows => setJazzData(prev => {
                const next = { ...prev };
                rows.forEach(row => { if (row.date) next[row.date.trim()] = row; });
                return next;
            }))
            .catch(() => {});
        return yearLoadsRef.current[year];
    }, []);

    useEffect(() => {
        const loadChangelog = fetch('/data/changelog.json')
            .then(res => res.json())
            .then(cl => setChangelogData(cl.slice().sort((a, b) => b.date.localeCompare(a.date))))
            .catch(() => {});
        Promise.all([loadYear(introTargetDate.getFullYear()), loadChangelog]).then(() => setDataReady(true));
    }, [loadYear, introTargetDate]);

    // 搜尋要涵蓋所有年份：第一次點進搜尋框時才把其餘年份補齊
    const loadAllYears = useCallback(() => {
        for (let year = FIRST_YEAR; year <= new Date().getFullYear(); year++) loadYear(year);
    }, [loadYear]);

    // 唱片行的櫃子要擺滿所有年份
    useEffect(() => {
        if (viewMode === 'shop') loadAllYears();
    }, [viewMode, loadAllYears]);

    // 選到的日期、翻到的月份屬於哪一年就載入哪一年；前一年也一起載，「去年的今天」才查得到
    const selectedYear = selectedDate.getFullYear();
    const monthYear = currentMonth.getFullYear();
    useEffect(() => {
        [selectedYear, selectedYear - 1, monthYear].forEach(loadYear);
    }, [selectedYear, monthYear, loadYear]);

    useEffect(() => {
        if (introMode !== 'calendar') return;
        try { sessionStorage.setItem(INTRO_SEEN_KEY, '1'); } catch { /* 寫不進去就下次再播一次，無妨 */ }
    }, [introMode]);

    const handleIntroDone = useCallback(() => setShowIntro(false), []);

    const changeViewMode = (mode) => {
        if (mode === 'shop') setShopOpened(true);
        setBackToShop(false);
        setViewMode(mode);
    };

    const handleIntroChoose = (mode) => {
        changeViewMode(mode);
        try { localStorage.setItem(HOME_MODE_KEY, mode); } catch { /* 記不住就下次再選 */ }
    };
    const closeShortcuts = useCallback(() => setShowShortcuts(false), []);

    const latestVersion = changelogData[0]?.version || "v1.0.0";

    const headline = (currentData?.album || '').toUpperCase();
    const winTitle = viewMode === 'shop'
        ? 'JAZZ 365 RECORDS — EXPLORE'
        : viewMode === 'wall'
        ? `${currentMonth.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()} ${currentMonth.getFullYear()} — RECORD WALL`
        : currentData
        ? `${String(selectedDate.getDate()).padStart(2,'0')} ${selectedDate.toLocaleDateString('en-US',{month:'short'}).toUpperCase()} — ${headline.slice(0,38)}${headline.length>38?'...':''}`
        : 'DAILY JAZZ ALMANAC';

    return (
        // overflow-x 用 clip 而不是 hidden：hidden 會讓這層變成捲動容器，側欄的 position: sticky 就失效、跟著頁面捲走
        <div className="retro-desktop min-h-screen font-sans text-stone-800 relative overflow-x-clip"
             style={{ '--mood-accent': moodAccent, '--mood-glow': moodGlow }}>

            {showIntro && (
                <IntroCalendar
                    targetDate={introTargetDate}
                    ready={dataReady}
                    onDone={handleIntroDone}
                    animate={introMode === 'calendar'}
                    choose={chooseOnEntry}
                    defaultChoice={homeMode}
                    onChoose={handleIntroChoose}
                />
            )}

            <RetroMenuBar
                viewMode={viewMode}
                onViewModeChange={changeViewMode}
                canImmerse={Boolean(youtubeId)}
                onImmerse={() => { changeViewMode('day'); setIsImmersive(true); }}
                onToday={() => { changeViewMode('day'); handleDateChange(new Date()); }}
                onShowShortcuts={() => setShowShortcuts(true)}
                onShowChangelog={() => setShowChangelog(true)}
            />

            {playerVideoId && (
                <div style={{ position: 'fixed', width: 1, height: 1, opacity: 0, pointerEvents: 'none', bottom: 0, left: 0, overflow: 'hidden' }}>
                    <div id="yt-player-mount" style={{ width: '100%', height: '100%' }}></div>
                </div>
            )}

            <ImmersiveMode
                isImmersive={isImmersive} isMinimized={isMinimized}
                handleCloseImmersive={handleCloseImmersive} handleMinimizeImmersive={handleMinimizeImmersive}
                selectedDate={selectedDate} togglePlay={togglePlay}
                handlePrevDay={handlePrevDay} handleNextDay={handleNextDay}
                currentData={currentData} youtubeId={youtubeId}
                player={player} playerState={playerState}
                isVinylSpinning={isVinylSpinning}
                playerError={playerError}
            />

            {isImmersive && isMinimized && !(viewMode === 'shop' && shopDeckOpen) && (
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
                            {currentData?.album || '—'}
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

            <ShortcutsModal open={showShortcuts} onClose={closeShortcuts} />

            <MobileNav
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                handleDateChange={handleDateChange}
                handlePrevDay={handlePrevDay}
                handleNextDay={handleNextDay}
                jazzData={visibleJazzData}
                onSearchOpen={loadAllYears}
                isVinylSpinning={isVinylSpinning}
                setShowChangelog={setShowChangelog}
                latestVersion={latestVersion}
            />

            <div className={`max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 relative ${introMode === 'skeleton' ? 'shell-enter' : ''}`}
                 style={{ padding: '4px 12px 12px', paddingTop: '28px', paddingBottom: isMinimized ? '120px' : '12px' }}>

                <Sidebar
                    isVinylSpinning={isVinylSpinning}
                    currentMonth={currentMonth} setCurrentMonth={setCurrentMonth}
                    selectedDate={selectedDate} handleDateChange={handleDateChange} jazzData={visibleJazzData}
                    onSearchOpen={loadAllYears}
                    setShowChangelog={setShowChangelog} latestVersion={latestVersion}
                />

                <div className="lg:col-span-9 relative retro-win flex flex-col" style={{ alignSelf: 'flex-start', minHeight: '600px' }}>

                    <RetroTitleBar
                        title={winTitle}
                        className="hidden lg:flex"
                        style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}
                    />

                    {/* 單日／唱片牆切換 */}
                    <div className="flex items-center justify-end gap-2 px-3 py-1.5 bg-[#e8dfd3] border-b border-[#3a2808]/40">
                        {viewMode === 'day' && backToShop && (
                            <button type="button" className="back-to-shop mr-auto" onClick={() => changeViewMode('shop')}>← 回到唱片行</button>
                        )}
                        <div className="view-toggle" role="group" aria-label="檢視方式">
                            <button type="button" aria-pressed={viewMode === 'day'} onClick={() => changeViewMode('day')}>單日</button>
                            <button type="button" aria-pressed={viewMode === 'wall'} onClick={() => changeViewMode('wall')}>唱片牆</button>
                            <button type="button" aria-pressed={viewMode === 'shop'} onClick={() => changeViewMode('shop')}>唱片行</button>
                        </div>
                    </div>

                    {shopOpened && (
                        <div className="retro-body relative flex-1 shop-body" style={{ display: viewMode === 'shop' ? undefined : 'none' }}>
                            <Suspense fallback={<div className="shop-root shop-root--loading"><p className="shop-pixel-text">LOADING...</p></div>}>
                                <ShopMode
                                    data={visibleJazzData}
                                    active={viewMode === 'shop'}
                                    interactive={viewMode === 'shop' && !(isImmersive && !isMinimized) && !showShortcuts && !showChangelog}
                                    nowPlaying={isImmersive && currentData ? { ...currentData, date: dateKey } : null}
                                    isVinylSpinning={isVinylSpinning}
                                    player={player}
                                    playerState={playerState}
                                    playerError={playerError}
                                    onTogglePlay={togglePlay}
                                    onStartPlay={handleShopStart}
                                    onPlay={handleShopPlay}
                                    onRead={handleShopRead}
                                    onDeckOpenChange={setShopDeckOpen}
                                />
                            </Suspense>
                        </div>
                    )}
                    {viewMode === 'wall' ? (
                        <div className="retro-body relative flex-1" style={{ backgroundColor: '#f2ece3' }}>
                            <MonthWall
                                month={currentMonth}
                                data={visibleJazzData}
                                selectedDate={selectedDate}
                                onMonthChange={setCurrentMonth}
                                onPick={(date) => {
                                    changeViewMode('day');
                                    handleDateChange(date);
                                    window.scrollTo(0, 0);
                                }}
                            />
                        </div>
                    ) : viewMode === 'day' ? (
                    <div className="retro-body relative overflow-hidden flex-1 flex flex-col" style={{ backgroundColor: moodHex }}>

                        <PageSheet
                            key={dateKey}
                            className={`flex-1 ${enterDirection === 'backward' ? 'page-sheet--drop' : ''}`}
                            style={{ backgroundColor: moodHex }}
                            date={selectedDate}
                            data={currentData}
                            ready={dataReady}
                            youtubeId={youtubeId}
                            lastYear={lastYearOf(selectedDate)}
                            setIsImmersive={setIsImmersive}
                            revealContent={enterDirection === null}
                        />

                        {leavingSheets[0]?.direction === 'forward' && (
                            <div key={`shade-${leavingSheets.at(-1).id}`} className="page-sheet-shade" aria-hidden="true" />
                        )}

                        {/* 往後翻：越早撕的越在上面；往前翻：越晚被蓋住的越在上面 */}
                        {(leavingSheets[0]?.direction === 'forward' ? [...leavingSheets].reverse() : leavingSheets).map(sheet => {
                            const sheetMood = resolveMoodHex(sheet.data?.mood);
                            const { accent, glow } = hexToMoodVars(sheetMood);
                            return (
                                <PageSheet
                                    key={sheet.id}
                                    inert
                                    className={`page-sheet--leaving ${sheet.direction === 'forward' ? 'page-sheet--tear' : 'page-sheet--under'}`}
                                    style={{ backgroundColor: sheetMood, '--mood-accent': accent, '--mood-glow': glow }}
                                    date={sheet.date}
                                    data={sheet.data}
                                    ready
                                    youtubeId={getYouTubeVideoId(sheet.data?.youtube)}
                                    lastYear={lastYearOf(sheet.date)}
                                />
                            );
                        })}
                    </div>
                    ) : null}
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
