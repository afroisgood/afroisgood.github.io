// src/components/VintageJazzText.jsx
// 復古爵士海報字型裝飾 — 低透明度散落英文字，模擬舊海報紙印刷殘留感
// 只散在右欄的下半部（按鈕與 Album Notes 後面），避開上方的日期與專輯大標題

const WORDS = [
    { text: 'BEBOP',     top: '58%',  left: '62%',  size: '3.6rem', rot: '-14deg', op: 0.035 },
    { text: 'SWING',     top: '66%',  left: '84%',  size: '2rem',   rot: '7deg',   op: 0.03  },
    { text: '1959',      top: '54%',  left: '86%',  size: '4.4rem', rot: '-4deg',  op: 0.025 },
    { text: 'BLUE NOTE', top: '62%',  left: '55%',  size: '1.4rem', rot: '3deg',   op: 0.04  },
    { text: 'COOL',      top: '72%',  left: '58%',  size: '3rem',   rot: '-9deg',  op: 0.03  },
    { text: 'HARD BOP',  top: '76%',  left: '72%',  size: '2.4rem', rot: '-6deg',  op: 0.03  },
    { text: 'MODAL',     top: '86%',  left: '55%',  size: '1.8rem', rot: '10deg',  op: 0.035 },
    { text: 'FREE',      top: '82%',  left: '88%',  size: '2.6rem', rot: '5deg',   op: 0.025 },
    { text: 'QUARTET',   top: '92%',  left: '76%',  size: '1.4rem', rot: '-3deg',  op: 0.04  },
    { text: 'JAZZ',      top: '88%',  left: '64%',  size: '4rem',   rot: '-16deg', op: 0.02  },
];

export const VintageJazzText = () => {
    return (
        <div
            className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden"
            aria-hidden="true"
        >
            {WORDS.map(({ text, top, left, size, rot, op }) => (
                <span
                    key={text}
                    style={{
                        position: 'absolute',
                        top,
                        left,
                        fontSize: size,
                        transform: `rotate(${rot})`,
                        opacity: op,
                        fontFamily: "'Playfair Display', serif",
                        fontWeight: 900,
                        letterSpacing: '0.08em',
                        color: '#292524',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                        userSelect: 'none',
                    }}
                >
                    {text}
                </span>
            ))}
        </div>
    );
};
