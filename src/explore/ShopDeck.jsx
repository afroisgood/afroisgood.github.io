// 唱片行的唱盤畫面：放上唱盤時先播俯視特寫的過場（手把唱片放上轉盤、拉唱臂落針），
// 落針後鏡頭往前傾，切到斜上方的透視唱盤（perspectiveDeck.js）停在那裡播放。唱片中間的標籤是這張專輯的像素封面。
// 俯視特寫畫在 160×112 格的座標裡（畫面取唱盤附近 118×104 格），過場動畫用 CSS（index.css 的 .deck-cut-*），時間軸對照 CUT_MS。
// 透視畫面裡：播放中唱片轉、唱臂隨進度由外圈往內圈移，角色站在桌前跟著音樂搖擺；暫停時唱片停住、角色站著，播完或無法播放時唱臂抬起。
// 旁邊是唱片資訊、進度條、播放／上一張／下一張（同一櫃），以及回到店裡、閱讀這天。
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { IconPause, IconPlay, IconSkipBack, IconSkipForward } from '../components/Icons';
import { formatTime, usePlaybackTime } from '../hooks/usePlaybackTime';
import { formatRecordDate } from './crates';
import { spriteRuns } from './sprites';
import { useWalkCycle } from './useWalkCycle';
import { useCoverPixels, labelRows, toRuns, LABEL_R } from './coverPixels';
import {
    SCENE_W, SCENE_H, DISC_CX, DISC_CY, FRAME_W, FRAME_H, FRAMES, ARM_PIVOT_X, ARM_PIVOT_Y,
    ARM_REST, ARM_OUTER, ARM_INNER, perspectiveSceneRuns, perspectiveDiscFrames, perspectiveArmRuns,
} from './perspectiveDeck';

const CUT_MS = 2300; // 與 index.css 的 .deck-cut-* 動畫總長一致

const OUTLINE = '#1c1410';

const STREAM_LINKS = [
    { key: 'youtube', label: 'YouTube' },
    { key: 'spotify', label: 'Spotify' },
    { key: 'appleMusic', label: 'Apple Music' },
    { key: 'other', label: '其他' },
];

// 以列為單位畫實心圓，回傳 <rect> 陣列
const disk = (cx, cy, r, fill, key) => {
    const rows = [];
    for (let y = Math.floor(cy - r); y < Math.ceil(cy + r); y++) {
        const dy = y + 0.5 - cy;
        const half = Math.sqrt(Math.max(0, r * r - dy * dy));
        const x0 = Math.round(cx - half);
        const x1 = Math.round(cx + half);
        if (x1 > x0) rows.push(<rect key={`${key}-${y}`} x={x0} y={y} width={x1 - x0} height={1} fill={fill} />);
    }
    return rows;
};

// 唱盤中心、唱臂支點（格）
const CX = 68;
const CY = 42;
const PIVOT_X = 112;
const PIVOT_Y = 22;

// 手：22×14 格，面朝右；flip 時面朝左。袖口用角色上衣的顏色
const Hand = ({ x, y, palette, flip = false }) => {
    const parts = [
        [0, 2, 8, 10, palette.T], [0, 2, 8, 1, OUTLINE], [0, 11, 8, 1, OUTLINE], [1, 3, 1, 8, palette.t],
        [8, 3, 9, 8, palette.S], [8, 3, 9, 1, OUTLINE], [8, 10, 9, 1, OUTLINE],
        [17, 4, 4, 2, palette.S], [17, 3, 4, 1, OUTLINE], [21, 4, 1, 2, OUTLINE],
        [17, 7, 5, 2, palette.S], [17, 9, 5, 1, OUTLINE],
        [12, 11, 5, 2, palette.S], [12, 13, 5, 1, OUTLINE],
    ];
    return parts.map(([px, py, w, h, fill], i) => (
        <rect key={i} x={x + (flip ? 22 - px - w : px)} y={y + py} width={w} height={h} fill={fill} />
    ));
};

const Runs = ({ runs, x = 0, y = 0 }) => runs.map((r, i) => (
    <rect key={i} x={x + r.x} y={y + r.y} width={r.w} height={1} fill={r.fill} />
));

// 俯視的唱片；px 是像素封面（沒有就用金色標籤）
const Disc = ({ px }) => (
    <>
        {disk(CX, CY, 24, '#151010', 'd')}
        {[21, 18, 15, 12].flatMap(r => [...disk(CX, CY, r + 0.6, '#2e2622', `g${r}`), ...disk(CX, CY, r, '#151010', `h${r}`)])}
        {px ? (
            <Runs runs={toRuns(labelRows(px))} x={CX - LABEL_R} y={CY - LABEL_R} />
        ) : (
            <>
                {disk(CX, CY, 8, '#c8a048', 'l')}
                <rect x={CX - 6} y={CY - 4} width={12} height={1} fill="#7a3b2e" />
                <rect x={CX - 4} y={CY + 2} width={8} height={1} fill="#7a3b2e" />
            </>
        )}
        {disk(CX, CY, 1.5, OUTLINE, 'hole')}
        <rect x={CX - 16} y={CY - 10} width={5} height={1} fill="#4a4440" />
        <rect x={CX - 14} y={CY - 12} width={3} height={1} fill="#4a4440" />
    </>
);

const Note = ({ x, y }) => (
    <>
        <rect x={x + 4} y={y} width={1} height={7} fill="#e0bc68" />
        <rect x={x + 5} y={y} width={2} height={1} fill="#e0bc68" />
        <rect x={x + 6} y={y + 1} width={1} height={2} fill="#e0bc68" />
        <rect x={x + 1} y={y + 6} width={4} height={3} fill="#e0bc68" />
        <rect x={x} y={y + 7} width={1} height={1} fill="#e0bc68" />
    </>
);

// 角色站的位置（格）：俯視特寫裡在唱盤下方，透視畫面裡在桌子前面的地板上
const DANCER_X = 60;
const DANCER_Y = 82;
const P_DANCER_X = 82;
const P_DANCER_Y = 80;

// 透視畫面的背景（牆、桌、底座、轉盤）不會變，只畫一次
const PerspectiveScene = memo(() => <Runs runs={perspectiveSceneRuns()} />);
PerspectiveScene.displayName = 'PerspectiveScene';

// 8 格轉動的唱片疊在一起，播放中由 CSS 輪流顯示（.deck-pframe）；換唱片才重算
const PerspectiveDisc = memo(({ px }) => {
    const frames = useMemo(() => perspectiveDiscFrames(px), [px]);
    return frames.map((runs, f) => (
        <g key={f} className={'deck-pframe' + (f === 0 ? ' deck-pframe--first' : '')} style={{ animationDelay: `${(-f * 0.9) / FRAMES}s` }}>
            <Runs runs={runs} x={DISC_CX - FRAME_W / 2} y={DISC_CY - FRAME_H / 2 - 1} />
        </g>
    ));
});
PerspectiveDisc.displayName = 'PerspectiveDisc';

const prefersReducedMotion = () => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

export const ShopDeck = ({
    character, record, take, placing, enabled, onPlaced, onDeck,
    player, playerState, playerError,
    onTogglePlay, onReplay, onPrev, onNext, onBack, onRead,
}) => {
    const settled = !placing;
    const [time, setTime] = usePlaybackTime(player, settled && onDeck);
    const placedRef = useRef(false);
    const [reduceMotion] = useState(prefersReducedMotion);
    const coverPx = useCoverPixels(record.date);
    const handlersRef = useRef({});

    useEffect(() => { handlersRef.current = { onPlaced, onPrev, onNext, onBack }; });

    // 過場：時間到或按任意鍵／點畫面就落定
    useEffect(() => {
        if (!placing) return;
        placedRef.current = false;
        const finish = () => {
            if (placedRef.current) return;
            placedRef.current = true;
            handlersRef.current.onPlaced();
        };
        const timer = setTimeout(finish, CUT_MS);
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            e.preventDefault();
            finish();
        };
        window.addEventListener('keydown', onKey);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('keydown', onKey);
        };
    }, [placing, record.date]);

    // 落定後：Esc 回到店裡，← → 換同一櫃的上一張／下一張（Space 播放／暫停由 App 處理）。
    // 唱片行被切走（閱讀這天）或沉浸模式全螢幕時不搶按鍵
    useEffect(() => {
        if (placing || !enabled) return;
        const onKey = (e) => {
            if (isTyping(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return;
            const h = handlersRef.current;
            if (e.key === 'Escape') { e.preventDefault(); h.onBack(); }
            else if (e.key === 'ArrowLeft' && h.onPrev) { e.preventDefault(); h.onPrev(); }
            else if (e.key === 'ArrowRight' && h.onNext) { e.preventDefault(); h.onNext(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [placing, enabled]);

    const skip = () => {
        if (placedRef.current) return;
        placedRef.current = true;
        onPlaced();
    };

    const playing = onDeck && (playerState === 1 || playerState === 3);
    // 播放中角色跟著音樂換腳；上下擺動和轉身交給 CSS（.deck-stage--spinning .deck-dancer-*）
    const dancing = settled && playing && !reduceMotion;
    const danceFrame = useWalkCycle(dancing, 4);
    const unavailable = onDeck && Boolean(playerError);
    const progress = time.duration > 0 ? Math.min(1, Math.max(0, time.current / time.duration)) : 0;
    const armOnRecord = settled && onDeck && !playerError && [1, 2, 3].includes(playerState);
    const arm = armOnRecord
        ? { deg: ARM_OUTER.deg + (ARM_INNER.deg - ARM_OUTER.deg) * progress, scale: ARM_OUTER.scale + (ARM_INNER.scale - ARM_OUTER.scale) * progress }
        : ARM_REST;
    const dancerRuns = spriteRuns(character, dancing ? danceFrame : 'idle');

    const status = placing ? 'PLACING…'
        : unavailable ? 'UNAVAILABLE'
        : !onDeck ? 'STOPPED'
        : playerState === 1 ? 'NOW SPINNING'
        : playerState === 3 ? 'CUEING…'
        : playerState === 2 ? 'PAUSED'
        : playerState === 0 ? 'SIDE ENDED'
        : 'LOADING…';

    const canSeek = settled && onDeck && !unavailable && time.duration > 0;
    const handleSeek = (e) => {
        const target = Number(e.target.value);
        try { player.seekTo(target, true); } catch { /* 播放器尚未就緒 */ }
        setTime(prev => ({ ...prev, current: target }));
    };

    const note = record.editorNote?.trim();
    const albumNote = record.albumNotes?.trim();
    const streamLinks = STREAM_LINKS.filter(l => record[l.key]);

    const planks = [];
    for (let y = 11; y < 76; y += 12) planks.push(<rect key={y} x={0} y={y} width={160} height={1} fill="#24160f" />);
    // 唱盤桌前面的地板，跟店裡一樣的格子
    const tiles = [];
    for (let row = 0; row * 7 < 30; row++) {
        for (let col = 0; col * 8 < 160; col++) {
            if ((row + col) % 2) tiles.push(<rect key={row + '-' + col} x={col * 8} y={82 + row * 7} width={8} height={7} fill="#b39c78" />);
        }
    }

    const stageClass = 'shop-deck__stage '
        + (placing ? 'deck-stage--placing' : 'deck-stage--settled')
        + (settled && playing ? ' deck-stage--spinning' : '');

    return (
        <div className="shop-deck" role="dialog" aria-label={`唱盤：${record.artist}《${record.album}》`}>
            {/* take 每放一次唱片就換，整個舞台重掛，過場動畫從頭播 */}
            <div key={take} className={stageClass}>
                {/* 俯視特寫：放唱片的過場 */}
                <svg className="deck-cut__svg deck-view deck-view--top" viewBox="22 4 118 104" shapeRendering="crispEdges" aria-hidden="true">
                    <rect x={0} y={0} width={160} height={112} fill="#2a1a12" />
                    {planks}
                    <rect x={0} y={76} width={160} height={3} fill="#6b4630" />
                    <rect x={0} y={79} width={160} height={3} fill="#4a2f22" />
                    <rect x={0} y={82} width={160} height={30} fill="#d9c7a5" />
                    {tiles}

                    {/* 角色：站在唱盤下方，播放中跟著音樂搖擺 */}
                    <ellipse cx={DANCER_X + 8} cy={DANCER_Y + 24} rx={7} ry={1.5} fill="#000" opacity={0.25} />
                    <Runs runs={spriteRuns(character, 'idle')} x={DANCER_X} y={DANCER_Y} />

                    {/* 唱盤（俯視） */}
                    <rect x={32} y={12} width={96} height={60} fill={OUTLINE} />
                    <rect x={33} y={13} width={94} height={58} fill="#6b4630" />
                    <rect x={33} y={13} width={94} height={2} fill="#8a5a3a" />
                    <rect x={33} y={68} width={94} height={3} fill="#4a2f22" />
                    {disk(CX, CY, 27, OUTLINE, 'p0')}
                    {disk(CX, CY, 26, '#3a3430', 'p1')}
                    {disk(CX, CY, 24, '#2a2420', 'p2')}
                    {disk(CX, CY, 2, '#9a948c', 'spindle')}
                    <rect x={106} y={52} width={14} height={10} fill="#2a1a12" />
                    <rect x={108} y={54} width={4} height={2} fill="#b4513a" />
                    <rect x={114} y={54} width={4} height={2} fill="#c8a048" />
                    {disk(PIVOT_X, PIVOT_Y, 5, OUTLINE, 'b0')}
                    {disk(PIVOT_X, PIVOT_Y, 4, '#9a948c', 'b1')}

                    {/* 唱片放下前的影子 */}
                    <ellipse className="deck-cut-shadow" cx={CX + 2} cy={CY + 4} rx={22} ry={21} fill="#000" />

                    {/* 手拿著唱片從左邊進來，放下後手退出去 */}
                    <g className="deck-cut-carry">
                        <g className="deck-cut-lift">
                            <g className="deck-cut-spin">
                                <Disc px={coverPx} />
                            </g>
                        </g>
                        <g className="deck-cut-hand-out">
                            <Hand x={CX - 24 - 14} y={CY - 7} palette={character.palette} />
                        </g>
                    </g>

                    {/* 唱臂：過場時另一隻手把它推到唱片外圈 */}
                    <g className="deck-cut-arm">
                        <rect x={PIVOT_X - 1} y={PIVOT_Y} width={2} height={38} fill="#c9c3b8" />
                        <rect x={PIVOT_X} y={PIVOT_Y} width={1} height={38} fill="#9a948c" />
                        <rect x={PIVOT_X - 3} y={PIVOT_Y + 37} width={6} height={7} fill="#2a2420" />
                        <rect x={PIVOT_X - 2} y={PIVOT_Y + 38} width={4} height={2} fill="#c8a048" />
                        <rect x={PIVOT_X - 1} y={PIVOT_Y + 44} width={2} height={2} fill="#9a948c" />
                        <g className="deck-cut-hand2">
                            <Hand x={PIVOT_X + 1} y={PIVOT_Y + 34} palette={character.palette} flip />
                        </g>
                    </g>
                    {disk(PIVOT_X, PIVOT_Y, 2, '#4a4440', 'cap')}

                    <g className="deck-cut-note deck-cut-note--1"><Note x={CX - 10} y={CY - 16} /></g>
                    <g className="deck-cut-note deck-cut-note--2"><Note x={CX + 4} y={CY - 14} /></g>
                </svg>

                {/* 透視唱盤：落針後鏡頭往前傾切到這裡，停在這裡播放 */}
                <svg
                    className="deck-cut__svg deck-view deck-view--persp"
                    viewBox={`0 0 ${SCENE_W} ${SCENE_H}`}
                    preserveAspectRatio="xMidYMid slice"
                    shapeRendering="crispEdges"
                    aria-hidden="true"
                >
                    <PerspectiveScene />
                    <PerspectiveDisc px={coverPx} />
                    <g
                        className="deck-parm"
                        style={{ transformOrigin: `${ARM_PIVOT_X}px ${ARM_PIVOT_Y}px`, transform: `rotate(${arm.deg}deg) scale(${arm.scale})` }}
                    >
                        <Runs runs={perspectiveArmRuns} />
                    </g>
                    <g className="deck-cut-note deck-cut-note--1"><Note x={DISC_CX - 12} y={DISC_CY - 18} /></g>
                    <g className="deck-cut-note deck-cut-note--2"><Note x={DISC_CX + 4} y={DISC_CY - 16} /></g>

                    <ellipse cx={P_DANCER_X + 8} cy={P_DANCER_Y + 24} rx={7} ry={1.5} fill="#000" opacity={0.25} />
                    <g className="deck-dancer-turn" style={{ transformOrigin: `${P_DANCER_X + 8}px ${P_DANCER_Y + 24}px` }}>
                        <g className="deck-dancer-bob" style={{ transformOrigin: `${P_DANCER_X + 8}px ${P_DANCER_Y + 24}px` }}>
                            <Runs runs={dancerRuns} x={P_DANCER_X} y={P_DANCER_Y} />
                        </g>
                    </g>
                </svg>
                {placing ? (
                    <button type="button" className="shop-deck__skip" onClick={skip} aria-label="放上唱盤中，點一下跳過">
                        <span className="deck-cut__hint">點一下跳過</span>
                    </button>
                ) : (
                    <button type="button" className="shop-btn shop-deck__back" onClick={onBack}>← 回到店裡</button>
                )}
            </div>

            <aside className="shop-deck__panel">
                <p className="shop-pixel-text shop-deck__status">{status}</p>
                <p className="crate-browser__date">{formatRecordDate(record.date)}</p>
                <h3 className="crate-browser__album font-playfair">{record.album}</h3>
                <p className="crate-browser__artist">{record.artist}</p>

                {unavailable ? (
                    <div className="shop-deck__error">
                        <p>{playerError === 101 || playerError === 150
                            ? '這張唱片的版權方不允許在網站內播放，請到串流平台收聽：'
                            : `影片無法播放（錯誤 ${playerError}），請到串流平台收聽：`}</p>
                        <div className="crate-browser__actions">
                            {streamLinks.map(l => (
                                <a key={l.key} href={record[l.key]} target="_blank" rel="noopener noreferrer" className="shop-btn shop-deck__link">{l.label} ↗</a>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="shop-deck__progress">
                        <input
                            type="range"
                            min={0}
                            max={canSeek ? Math.floor(time.duration) : 0}
                            step={1}
                            value={canSeek ? Math.floor(Math.min(time.current, time.duration)) : 0}
                            onChange={handleSeek}
                            disabled={!canSeek}
                            aria-label="播放進度"
                            aria-valuetext={`${formatTime(time.current)} / ${formatTime(time.duration)}`}
                            className="turntable-range"
                            style={{ '--progress': `${canSeek ? progress * 100 : 0}%` }}
                        />
                        <div className="shop-deck__times">
                            <span>{canSeek ? formatTime(time.current) : '00:00'}</span>
                            <span>{canSeek ? formatTime(time.duration) : '--:--'}</span>
                        </div>
                    </div>
                )}

                <div className="shop-deck__controls">
                    <button type="button" className="shop-btn shop-btn--square" onClick={onPrev} disabled={!onPrev} aria-label="同一櫃的上一張">
                        <IconSkipBack size={16} />
                    </button>
                    <button
                        type="button"
                        className="shop-btn shop-btn--primary shop-deck__play"
                        onClick={onDeck ? onTogglePlay : onReplay}
                        disabled={placing || unavailable}
                        aria-label={playing ? '暫停' : '播放'}
                    >
                        {playing ? <IconPause size={18} /> : <IconPlay size={18} />}
                    </button>
                    <button type="button" className="shop-btn shop-btn--square" onClick={onNext} disabled={!onNext} aria-label="同一櫃的下一張">
                        <IconSkipForward size={16} />
                    </button>
                </div>

                <div className="shop-deck__nav">
                    <button type="button" className="shop-btn" onClick={onRead}>閱讀這天 →</button>
                </div>
                <p className="shop-hud__keys shop-deck__keys">Space 播放／暫停 · ← → 換唱片 · Esc 回到店裡</p>

                {(note || albumNote) && (
                    <div className="crate-pop">
                        <span className="crate-pop__label">{note ? '石編的話' : '專輯補充'}</span>
                        <p className="crate-pop__text">{note || albumNote}</p>
                    </div>
                )}
            </aside>
        </div>
    );
};
