// src/components/VintageJazzText.jsx
// 復古爵士海報字型裝飾 — 低透明度散落英文字，模擬舊海報紙印刷殘留感

const WORDS = [
    { text: 'BEBOP',     top: '8%',   left: '62%',  size: '4.2rem', rot: '-14deg', op: 0.055 },
    { text: 'SWING',     top: '22%',  left: '78%',  size: '2.1rem', rot: '7deg',   op: 0.04  },
    { text: '1959',      top: '5%',   left: '85%',  size: '5.8rem', rot: '-4deg',  op: 0.035 },
    { text: 'BLUES',     top: '38%',  left: '66%',  size: '1.8rem', rot: '12deg',  op: 0.05  },
    { text: 'COOL',      top: '52%',  left: '58%',  size: '3.6rem', rot: '-9deg',  op: 0.04  },
    { text: 'BLUE NOTE', top: '15%',  left: '55%',  size: '1.4rem', rot: '3deg',   op: 0.06  },
    { text: 'HARD BOP',  top: '68%',  left: '70%',  size: '2.8rem', rot: '-6deg',  op: 0.04  },
    { text: 'MODAL',     top: '78%',  left: '55%',  size: '2rem',   rot: '10deg',  op: 0.05  },
    { text: 'BOSSA',     top: '44%',  left: '82%',  size: '1.6rem', rot: '-11deg', op: 0.045 },
    { text: 'FREE',      top: '60%',  left: '88%',  size: '3rem',   rot: '5deg',   op: 0.035 },
    { text: 'QUARTET',   top: '83%',  left: '78%',  size: '1.5rem', rot: '-3deg',  op: 0.055 },
    { text: '1955',      top: '30%',  left: '88%',  size: '2.4rem', rot: '8deg',   op: 0.04  },
    { text: 'JAZZ',      top: '72%',  left: '60%',  size: '5rem',   rot: '-16deg', op: 0.03  },
    { text: 'KIND OF',   top: '90%',  left: '65%',  size: '1.8rem', rot: '4deg',   op: 0.05  },
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
