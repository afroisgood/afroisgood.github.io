// 放上唱盤的過場：切到唱盤俯視特寫，角色的手把唱片放上轉盤、拉唱臂落針，唱片轉起來後回到店裡。
// 整段畫在 160×84 格的座標裡（畫面只取唱盤附近 118×76 格），動畫用 CSS（index.css 的 .deck-cut-*），時間軸對照 CUT_MS。
// 點一下或按任何鍵就跳過；系統開了減少動態效果時整段略過。
import { useEffect, useRef } from 'react';

const CUT_MS = 2300; // 與 index.css 的 .deck-cut-* 動畫總長一致

const OUTLINE = '#1c1410';

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

const Disc = () => (
    <>
        {disk(CX, CY, 24, '#151010', 'd')}
        {[21, 18, 15, 12].flatMap(r => [...disk(CX, CY, r + 0.6, '#2e2622', `g${r}`), ...disk(CX, CY, r, '#151010', `h${r}`)])}
        {disk(CX, CY, 8, '#c8a048', 'l')}
        <rect x={CX - 6} y={CY - 4} width={12} height={1} fill="#7a3b2e" />
        <rect x={CX - 4} y={CY + 2} width={8} height={1} fill="#7a3b2e" />
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

export const DeckCutscene = ({ character, onDone }) => {
    const doneRef = useRef(false);
    const rootRef = useRef(null);
    const onDoneRef = useRef(onDone);

    useEffect(() => { onDoneRef.current = onDone; }, [onDone]);

    useEffect(() => {
        const finish = () => {
            if (doneRef.current) return;
            doneRef.current = true;
            onDoneRef.current();
        };
        rootRef.current?.focus({ preventScroll: true });
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
    }, []);

    const skip = () => {
        if (doneRef.current) return;
        doneRef.current = true;
        onDone();
    };

    const planks = [];
    for (let y = 11; y < 84; y += 12) planks.push(<rect key={y} x={0} y={y} width={160} height={1} fill="#24160f" />);

    return (
        <button ref={rootRef} type="button" className="deck-cut" onClick={skip} aria-label="放上唱盤中，點一下跳過">
            <svg className="deck-cut__svg" viewBox="22 4 118 76" shapeRendering="crispEdges" aria-hidden="true">
                <rect x={0} y={0} width={160} height={84} fill="#2a1a12" />
                {planks}

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
                            <Disc />
                        </g>
                    </g>
                    <g className="deck-cut-hand-out">
                        <Hand x={CX - 24 - 14} y={CY - 7} palette={character.palette} />
                    </g>
                </g>

                {/* 唱臂：另一隻手從右邊推到唱片外圈 */}
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
            <span className="deck-cut__hint">點一下跳過</span>
        </button>
    );
};
