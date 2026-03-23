// src/components/JazzPixelArt.jsx
// 像素爵士樂手 — 背景裝飾動畫元素

const P = 8; // 每格像素大小 (px)

// 顏色對照：0=透明  1=深色身體  2=樂器暖色  3=膚色
const DARK   = '#292524';
const INSTR  = '#92400e';
const SKIN   = '#57534e';

// ── 薩克斯風手 (10 x 15) ─────────────────────────────────
const SAX = [
  [0,0,1,1,1,1,0,0,0,0],
  [0,0,1,1,1,1,0,0,0,0],
  [0,0,0,3,3,0,0,0,0,0],
  [0,0,3,3,3,3,0,0,0,0],
  [0,0,0,3,3,0,0,0,0,0],
  [0,1,1,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,0,2,0,0],
  [1,1,1,1,1,1,0,2,2,0],
  [0,1,1,1,1,0,0,0,2,0],
  [0,0,1,1,1,0,0,0,2,0],
  [0,0,1,0,1,0,0,0,2,0],
  [0,0,1,0,1,0,0,2,2,0],
  [0,0,1,0,1,0,0,2,0,0],
  [0,0,1,0,1,0,2,2,0,0],
  [0,0,0,0,0,0,2,0,0,0],
];

// ── 小號手 (9 x 14) ──────────────────────────────────────
const TRUMPET = [
  [0,0,1,1,1,1,0,0,0],
  [0,1,1,1,1,1,1,0,0],
  [0,0,0,3,3,0,0,0,0],
  [0,0,3,3,3,3,0,0,0],
  [0,0,0,3,3,0,0,0,0],
  [0,1,1,1,1,1,0,0,0],
  [1,1,1,1,1,2,2,2,2],
  [0,1,1,1,0,0,2,2,0],
  [0,1,1,1,0,0,2,0,0],
  [0,0,1,1,0,0,0,0,0],
  [0,0,1,0,1,0,0,0,0],
  [0,0,1,0,1,0,0,0,0],
  [0,0,1,0,1,0,0,0,0],
  [0,0,1,0,1,0,0,0,0],
];

// ── 直立貝斯手 (8 x 16) ──────────────────────────────────
const BASSIST = [
  [0,0,1,1,1,0,0,0],
  [0,0,1,1,1,0,0,0],
  [0,0,0,3,3,0,0,0],
  [0,0,3,3,3,3,0,0],
  [0,0,0,3,3,0,0,0],
  [0,1,1,1,1,1,0,0],
  [0,1,1,1,1,1,2,2],
  [0,1,1,1,1,0,2,2],
  [0,0,1,1,1,0,2,2],
  [0,0,1,0,1,0,2,2],
  [0,0,1,0,1,0,2,1],
  [0,0,1,0,1,0,2,0],
  [0,0,1,0,1,0,2,0],
  [0,0,0,0,0,0,2,0],
  [0,0,0,0,0,2,2,0],
  [0,0,0,0,0,2,0,0],
];

function PixelFigure({ map, scale = 1 }) {
    const cols = map[0].length;
    const rows = map.length;
    const ps = P * scale;
    return (
        <svg
            width={cols * ps}
            height={rows * ps}
            style={{ imageRendering: 'pixelated', display: 'block' }}
        >
            {map.map((row, y) =>
                row.map((val, x) => {
                    if (val === 0) return null;
                    const fill = val === 1 ? DARK : val === 2 ? INSTR : SKIN;
                    return (
                        <rect
                            key={x + '-' + y}
                            x={x * ps}
                            y={y * ps}
                            width={ps}
                            height={ps}
                            fill={fill}
                        />
                    );
                })
            )}
        </svg>
    );
}

export const JazzPixelArt = () => {
    return (
        <div
            className="absolute bottom-0 right-0 pointer-events-none select-none z-0 flex items-end"
            style={{ gap: '20px', paddingRight: '12px', paddingBottom: '4px', opacity: 0.1 }}
        >
            {/* 貝斯手 — 最遠景，較小 */}
            <div style={{ animation: 'jazzBob 3.6s ease-in-out infinite 0.4s', transformOrigin: 'bottom center' }}>
                <PixelFigure map={BASSIST} scale={0.85} />
            </div>

            {/* 小號手 — 中景 */}
            <div style={{ animation: 'jazzSway 2.8s ease-in-out infinite 0.8s', transformOrigin: 'bottom center' }}>
                <PixelFigure map={TRUMPET} scale={1} />
            </div>

            {/* 薩克斯風手 — 最近景，較大 */}
            <div style={{ animation: 'jazzSway 3.2s ease-in-out infinite', transformOrigin: 'bottom center' }}>
                <PixelFigure map={SAX} scale={1.2} />
            </div>
        </div>
    );
};
