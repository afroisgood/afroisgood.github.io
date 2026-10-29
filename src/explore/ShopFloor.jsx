// 唱片行店內：橫向捲動的一條走道。門口在最左邊，唱片櫃沿牆排開，最裡面是櫃台和唱盤。
// 座標都用「像素格」計算，畫面上一格 = scale 個螢幕像素（手機 3、桌機 4）。
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { PixelSprite } from './PixelSprite';
import { PixelCover } from './PixelCover';
import { SHOPKEEPER } from './sprites';
import { coverSrc } from './crates';
import { useWalkCycle } from './useWalkCycle';

const H = 120;           // 場景高度
const FLOOR_Y = 92;      // 牆與地板的交界
const FEET_Y = 114;      // 角色腳底
const CRATE_START = 64;
const CRATE_W = 40;
const CRATE_STEP = 54;
const COUNTER_W = 84;
const START_X = 30;
const MIN_X = 10;
const SPEED = 84;        // 每秒走幾格
const REACH = 22;        // 離唱片櫃中心多近算站在櫃子前

const SLEEVES = ['#2f4a5c', '#c8a048', '#7a3b2e', '#d9cbb4', '#3d5a40', '#b4513a', '#5b4a6e'];

const crateCenter = (i) => CRATE_START + i * CRATE_STEP + CRATE_W / 2;
const counterLeft = (crateCount) => CRATE_START + crateCount * CRATE_STEP + 12;
const worldWidth = (crateCount) => counterLeft(crateCount) + COUNTER_W + 20;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

// 角色移動：按住方向鍵／按鈕持續走，點地板或櫃子就自己走過去；只有在動的時候才跑 requestAnimationFrame
const usePlayerMovement = (worldW, enabled, onArrive) => {
    const [x, setX] = useState(START_X);
    const [facing, setFacing] = useState(1);
    const [moving, setMoving] = useState(false);
    const xRef = useRef(START_X);
    const holdRef = useRef(0);
    const targetRef = useRef(null);
    const rafRef = useRef(0);
    const onArriveRef = useRef(onArrive);

    useEffect(() => { onArriveRef.current = onArrive; }, [onArrive]);

    const kick = useCallback(() => {
        if (rafRef.current) return;
        let last = performance.now();
        const frame = (now) => {
            const dt = Math.min(0.05, (now - last) / 1000);
            last = now;
            let dir = holdRef.current;
            let arrived = null;
            if (dir) {
                targetRef.current = null;
            } else if (targetRef.current) {
                const diff = targetRef.current.x - xRef.current;
                if (Math.abs(diff) <= SPEED * dt) {
                    xRef.current = targetRef.current.x;
                    arrived = targetRef.current;
                    targetRef.current = null;
                } else {
                    dir = Math.sign(diff);
                }
            }
            if (dir) {
                xRef.current = clamp(xRef.current + dir * SPEED * dt, MIN_X, worldW - MIN_X);
                setFacing(dir);
            }
            setX(xRef.current);
            if (dir || targetRef.current) {
                setMoving(true);
                rafRef.current = requestAnimationFrame(frame);
            } else {
                setMoving(false);
                rafRef.current = 0;
                if (arrived?.crate) onArriveRef.current(arrived.crate);
            }
        };
        rafRef.current = requestAnimationFrame(frame);
    }, [worldW]);

    const hold = useCallback((dir) => {
        holdRef.current = dir;
        if (dir) kick();
    }, [kick]);

    const walkTo = useCallback((targetX, crate = null) => {
        targetRef.current = { x: clamp(targetX, MIN_X, worldW - MIN_X), crate };
        kick();
    }, [kick, worldW]);

    // 打開唱片櫃或進沉浸模式時停下來，免得放開按鍵的事件沒收到而一直走
    useEffect(() => {
        if (enabled) return;
        holdRef.current = 0;
        targetRef.current = null;
    }, [enabled]);

    useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

    return { x, facing, moving, hold, walkTo };
};

// 畫成方格的圓：黑膠唱片
const PixelDisc = ({ size, label }) => {
    const r = size / 2;
    const rows = [];
    for (let y = 0; y < size; y++) {
        const dy = y + 0.5 - r;
        const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)));
        if (half > 0) rows.push(<rect key={y} x={r - half} y={y} width={half * 2} height={1} fill="#1c1410" />);
    }
    return (
        <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges" aria-hidden="true">
            {rows}
            <rect x={r - 6} y={r - 1} width={3} height={1} fill="#3a3430" />
            <rect x={r + 3} y={r} width={3} height={1} fill="#3a3430" />
            <rect x={r - 2} y={r - 2} width={4} height={4} fill={label} />
            <rect x={r - 0.5} y={r - 0.5} width={1} height={1} fill="#1c1410" />
        </svg>
    );
};

// 牆、地板、門、燈、唱片櫃、櫃台：角色走動時不用重畫，所以包成 memo
const ShopScenery = memo(({ crates, scale, worldW, nearId, onCrateClick, onCrateFocus, nowPlaying, isVinylSpinning }) => {
    const u = (n) => n * scale;
    const cLeft = counterLeft(crates.length);
    const planks = [];
    for (let px = 0; px < worldW; px += 12) planks.push(<rect key={px} x={px} y={4} width={1} height={FLOOR_Y - 7} fill="#3d261b" />);
    const tiles = [];
    for (let row = 0; row * 7 < H - FLOOR_Y; row++) {
        for (let col = 0; col * 8 < worldW; col++) {
            if ((row + col) % 2) tiles.push(<rect key={row + '-' + col} x={col * 8} y={FLOOR_Y + row * 7} width={8} height={7} fill="#b39c78" />);
        }
    }
    const lamps = [];
    for (let lx = 90; lx < worldW - 40; lx += 108) lamps.push(lx);

    return (
        <>
            <svg
                className="shop-scenery"
                width={u(worldW)}
                height={u(H)}
                viewBox={`0 0 ${worldW} ${H}`}
                shapeRendering="crispEdges"
                aria-hidden="true"
            >
                <rect x={0} y={0} width={worldW} height={FLOOR_Y} fill="#4a2f22" />
                {planks}
                <rect x={0} y={0} width={worldW} height={4} fill="#2a1a12" />
                <rect x={0} y={60} width={worldW} height={2} fill="#6b4630" />
                <rect x={0} y={FLOOR_Y - 3} width={worldW} height={3} fill="#2a1a12" />
                <rect x={0} y={FLOOR_Y} width={worldW} height={H - FLOOR_Y} fill="#d9c7a5" />
                {tiles}

                {lamps.map(lx => (
                    <g key={lx}>
                        <circle cx={lx} cy={14} r={30} fill="#f5c76a" opacity={0.07} />
                        <circle cx={lx} cy={14} r={16} fill="#f5c76a" opacity={0.08} />
                        <rect x={lx} y={4} width={1} height={5} fill="#1c1410" />
                        <rect x={lx - 3} y={9} width={7} height={2} fill="#c8a048" />
                        <rect x={lx - 4} y={11} width={9} height={2} fill="#c8a048" />
                        <rect x={lx - 1} y={13} width={3} height={1} fill="#fff2c4" />
                    </g>
                ))}

                {/* 門口 */}
                <rect x={6} y={18} width={40} height={FLOOR_Y - 18} fill="#2a1a12" />
                <rect x={10} y={22} width={32} height={38} fill="#6f9aa0" />
                <rect x={12} y={24} width={6} height={20} fill="#a9cdd0" opacity={0.6} />
                <rect x={10} y={62} width={32} height={FLOOR_Y - 65} fill="#6b4630" />
                <rect x={36} y={66} width={3} height={4} fill="#c8a048" />

                {/* 櫃台與唱盤 */}
                <rect x={cLeft} y={66} width={COUNTER_W} height={FLOOR_Y + 6 - 66} fill="#6b4630" />
                <rect x={cLeft - 2} y={64} width={COUNTER_W + 4} height={4} fill="#8a5a3a" />
                <rect x={cLeft + 4} y={74} width={COUNTER_W - 8} height={1} fill="#4a2f22" />
                <rect x={cLeft + 4} y={86} width={COUNTER_W - 8} height={1} fill="#4a2f22" />
                <rect x={cLeft + 6} y={58} width={34} height={6} fill="#2a2420" />
                <rect x={cLeft + 8} y={59} width={2} height={1} fill="#b4513a" />
                <rect x={cLeft + 34} y={44} width={2} height={14} fill="#9a948c" />
                <rect x={cLeft + 31} y={44} width={3} height={2} fill="#9a948c" />
            </svg>

            {/* 招牌 */}
            <div className="shop-sign shop-pixel-text" style={{ left: u(CRATE_START), top: u(10), padding: `${u(2)}px ${u(3)}px`, fontSize: Math.round(scale * 3.5) }}>
                JAZZ 365 RECORDS
            </div>
            <div className="shop-open shop-pixel-text" style={{ left: u(14), top: u(30), fontSize: Math.round(scale * 2), padding: u(1) }}>
                OPEN
            </div>

            {/* 牆上的海報：隔一個櫃子掛一張 */}
            {crates.map((crate, i) => (i % 2 === 1 && crate.records[1] && !crate.shuffle ? (
                <div key={'poster-' + crate.id} className="shop-poster" style={{ left: u(crateCenter(i) - 11), top: u(i % 4 === 1 ? 26 : 30), padding: u(1) }}>
                    <PixelCover src={coverSrc(crate.records[1])} res={10} size={u(20)} fallback={SLEEVES[(i + 5) % SLEEVES.length]} />
                </div>
            ) : null))}

            {crates.map((crate, i) => {
                const cx = crateCenter(i);
                const front = crate.records[0];
                return (
                    <button
                        key={crate.id}
                        type="button"
                        className={'shop-crate ' + (nearId === crate.id ? 'shop-crate--near' : '')}
                        style={{ left: u(cx - CRATE_W / 2), top: u(50), width: u(CRATE_W), height: u(FLOOR_Y + 8 - 50) }}
                        onClick={(e) => { e.stopPropagation(); onCrateClick(i); }}
                        onFocus={() => onCrateFocus(i)}
                        aria-label={`${crate.title}，${crate.records.length} 張`}
                    >
                        <span className="shop-crate__sleeve" style={{ left: u(4), top: u(2), width: u(26), height: u(26), background: SLEEVES[i % SLEEVES.length] }} />
                        <span className="shop-crate__sleeve" style={{ left: u(10), top: u(0), width: u(26), height: u(26), background: SLEEVES[(i + 3) % SLEEVES.length] }} />
                        {crate.shuffle ? (
                            <span className="shop-crate__sleeve shop-pixel-text shop-crate__mystery" style={{ left: u(6), top: u(4), width: u(28), height: u(28), fontSize: u(6) }}>?</span>
                        ) : (
                            <PixelCover
                                src={coverSrc(front)}
                                res={12}
                                size={u(28)}
                                fallback={SLEEVES[(i + 1) % SLEEVES.length]}
                                className="shop-crate__sleeve"
                                style={{ left: u(6), top: u(4), position: 'absolute' }}
                            />
                        )}
                        <span className="shop-crate__box" style={{ height: u(24), borderWidth: u(1) }}>
                            <span className="shop-pixel-text" style={{ fontSize: Math.round(scale * 2.5) }}>{crate.label}</span>
                            <span className="shop-pixel-text shop-crate__sub" style={{ fontSize: Math.round(scale * 1.75) }}>{crate.sub}</span>
                        </span>
                    </button>
                );
            })}

            {/* 櫃台後的店長（下半身被櫃台擋住） */}
            <div className="shop-keeper" style={{ left: u(cLeft + COUNTER_W - 32), top: u(64 - 17), height: u(17) }}>
                <PixelSprite character={SHOPKEEPER} scale={scale} flip />
            </div>
            <div className={'shop-turntable ' + (isVinylSpinning ? 'shop-turntable--spinning' : '')} style={{ left: u(cLeft + 11), top: u(40), width: u(20), height: u(20) }}>
                <PixelDisc size={20} label={isVinylSpinning ? '#c8a048' : '#7a3b2e'} />
            </div>

            <div className="shop-nowplaying" style={{ left: u(cLeft + 4), top: u(14), width: u(COUNTER_W - 8), padding: u(2) }}>
                <span className="shop-pixel-text" style={{ fontSize: Math.round(scale * 1.75) }}>{nowPlaying ? 'NOW PLAYING' : 'ON THE DECK'}</span>
                {nowPlaying ? (
                    <span className="shop-nowplaying__row">
                        <PixelCover src={coverSrc(nowPlaying)} res={10} size={u(16)} />
                        <span className="shop-nowplaying__text" style={{ fontSize: Math.max(10, Math.round(scale * 2.75)) }}>{nowPlaying.album}</span>
                    </span>
                ) : (
                    <span className="shop-nowplaying__text" style={{ fontSize: Math.max(10, Math.round(scale * 2.75)) }}>挑一張放上唱盤</span>
                )}
            </div>
        </>
    );
});
ShopScenery.displayName = 'ShopScenery';

export const ShopFloor = ({ character, crates, enabled, onOpenCrate, onChangeCharacter, nowPlaying, isVinylSpinning }) => {
    const viewportRef = useRef(null);
    const worldRef = useRef(null);
    const [viewportW, setViewportW] = useState(0);
    const scale = viewportW && viewportW < 560 ? 3 : 4;
    const worldW = worldWidth(crates.length);

    const { x, facing, moving, hold, walkTo } = usePlayerMovement(worldW, enabled, onOpenCrate);
    const frame = useWalkCycle(moving);

    useEffect(() => {
        const el = viewportRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => setViewportW(entry.contentRect.width));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    let near = null;
    crates.forEach((crate, i) => {
        const d = Math.abs(crateCenter(i) - x);
        if (d < REACH && (!near || d < near.d)) near = { crate, d };
    });
    const nearCrate = near?.crate || null;
    const atCounter = x > counterLeft(crates.length) - 8;

    // 鍵盤：← → / A D 走路，↑ / W / Enter 翻眼前的唱片櫃
    useEffect(() => {
        if (!enabled) return;
        const LEFT = ['ArrowLeft', 'a', 'A'];
        const RIGHT = ['ArrowRight', 'd', 'D'];
        const onDown = (e) => {
            if (isTyping(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return;
            if (LEFT.includes(e.key)) { e.preventDefault(); hold(-1); }
            else if (RIGHT.includes(e.key)) { e.preventDefault(); hold(1); }
            else if (['ArrowUp', 'w', 'W', 'Enter'].includes(e.key)) {
                // 焦點在按鈕上時讓 Enter 照常按下那顆按鈕
                if (e.key === 'Enter' && e.target.closest?.('button, a')) return;
                if (nearCrate) { e.preventDefault(); onOpenCrate(nearCrate); }
            }
        };
        const onUp = (e) => {
            if (LEFT.includes(e.key) || RIGHT.includes(e.key)) hold(0);
        };
        const onBlur = () => hold(0);
        window.addEventListener('keydown', onDown);
        window.addEventListener('keyup', onUp);
        window.addEventListener('blur', onBlur);
        return () => {
            window.removeEventListener('keydown', onDown);
            window.removeEventListener('keyup', onUp);
            window.removeEventListener('blur', onBlur);
        };
    }, [enabled, hold, nearCrate, onOpenCrate]);

    const handleCrateClick = useCallback((i) => walkTo(crateCenter(i), crates[i]), [walkTo, crates]);
    // 用 Tab 移到畫面外的櫃子時，角色走過去、鏡頭跟著走
    const handleCrateFocus = useCallback((i) => walkTo(crateCenter(i)), [walkTo]);

    const handleFloorClick = (e) => {
        const rect = worldRef.current.getBoundingClientRect();
        walkTo((e.clientX - rect.left) / scale);
    };

    // 鏡頭跟著角色；整間店比畫面窄時置中
    const sceneW = worldW * scale;
    const camX = sceneW <= viewportW ? (sceneW - viewportW) / 2 : clamp(x * scale - viewportW / 2, 0, sceneW - viewportW);

    const holdProps = (dir) => ({
        onPointerDown: (e) => {
            // 手指滑出按鈕外也要收得到放開的事件
            try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* 不支援就算了 */ }
            hold(dir);
        },
        onPointerUp: () => hold(0),
        onPointerCancel: () => hold(0),
        onLostPointerCapture: () => hold(0),
        onContextMenu: (e) => e.preventDefault(),
    });

    const u = (n) => n * scale;
    // 對話框以角色頭頂為中心，靠近兩端時往內收，不要被畫面切掉
    const bubbleLeft = clamp(u(x), 150, sceneW - 150);

    return (
        <div className="shop-floor">
            {/* 鏡頭只用 transform 移動；瀏覽器為了露出焦點元素去捲這層時，捲回來 */}
            <div ref={viewportRef} className="shop-viewport" style={{ height: u(H) }} onScroll={(e) => { e.currentTarget.scrollLeft = 0; }}>
                <div
                    ref={worldRef}
                    className="shop-world"
                    style={{ width: sceneW, height: u(H), transform: `translateX(${-camX}px)` }}
                    onClick={handleFloorClick}
                >
                    <ShopScenery
                        crates={crates}
                        scale={scale}
                        worldW={worldW}
                        nearId={nearCrate?.id}
                        onCrateClick={handleCrateClick}
                        onCrateFocus={handleCrateFocus}
                        nowPlaying={nowPlaying}
                        isVinylSpinning={isVinylSpinning}
                    />

                    <span className="shop-shadow" style={{ left: u(x - 7), top: u(FEET_Y - 2), width: u(14), height: u(3) }} />
                    <div className="shop-player" style={{ left: u(x - 8), top: u(FEET_Y - 24) }}>
                        <PixelSprite character={character} frame={frame} scale={scale} flip={facing < 0} />
                    </div>

                    {nearCrate && enabled && !moving && (
                        <button
                            type="button"
                            className="shop-bubble"
                            style={{ left: bubbleLeft, top: u(FEET_Y - 24) - 8 }}
                            onClick={(e) => { e.stopPropagation(); onOpenCrate(nearCrate); }}
                        >
                            翻「{nearCrate.title}」<span className="shop-bubble__key">↑</span>
                        </button>
                    )}
                    {atCounter && !nearCrate && enabled && !moving && (
                        <span className="shop-bubble shop-bubble--talk" style={{ left: bubbleLeft, top: u(FEET_Y - 24) - 8 }}>
                            店長：慢慢挑，喜歡就放上唱盤聽聽看
                        </span>
                    )}
                </div>
            </div>

            <div className="shop-hud">
                <div className="shop-hud__pad">
                    <button type="button" className="shop-btn shop-btn--square" aria-label="往左走" {...holdProps(-1)}>◀</button>
                    <button type="button" className="shop-btn shop-btn--square" aria-label="往右走" {...holdProps(1)}>▶</button>
                </div>
                <p className="shop-hud__where">
                    {nearCrate ? `${nearCrate.title} · ${nearCrate.records.length} 張` : atCounter ? '櫃台' : x < CRATE_START - 4 ? '門口' : '走道'}
                    <span className="shop-hud__keys">← → 走路 · ↑ 翻唱片</span>
                </p>
                <div className="shop-hud__actions">
                    <button type="button" className="shop-btn shop-btn--primary" disabled={!nearCrate} onClick={() => nearCrate && onOpenCrate(nearCrate)}>
                        翻唱片
                    </button>
                    <button type="button" className="shop-btn" onClick={onChangeCharacter}>換角色</button>
                </div>
            </div>
        </div>
    );
};
