// src/components/RandomExplore.jsx
import { useState } from 'react';
import { RetroTitleBar } from './RetroTitleBar';

export const RandomExplore = ({ jazzData, onNavigate }) => {
    const [flipping, setFlipping]   = useState(false);
    const [lastLabel, setLastLabel] = useState(null);

    const handleSpin = () => {
        if (flipping) return;
        const available = Object.keys(jazzData || {}).filter(k => jazzData[k] && jazzData[k].album);
        if (available.length === 0) return;

        setFlipping(true);
        setLastLabel(null);

        setTimeout(() => {
            const pick = available[Math.floor(Math.random() * available.length)];
            const [y, m, d] = pick.split('-').map(Number);
            const artist = jazzData[pick].artist || '';
            const album  = jazzData[pick].album  || '';
            setLastLabel({ date: pick, artist, album });
            onNavigate(new Date(y, m - 1, d));
            setFlipping(false);
        }, 700);
    };

    return (
        <div className="retro-win" style={{ overflow: 'hidden' }}>
            {/* Mini title bar */}
            <RetroTitleBar title="RANDOM EXPLORE" mini />

            {/* Body */}
            <div className="retro-body" style={{ padding: '12px' }}>
                <p style={{
                    fontFamily: "'Courier New', Courier, monospace",
                    fontSize: '10px',
                    color: '#5a3820',
                    lineHeight: 1.7,
                    marginBottom: '10px',
                    letterSpacing: '0.03em',
                }}>
                    不知道聽什麼？<br />
                    讓命運替你選一張今日爵士。
                </p>

                <button
                    onClick={handleSpin}
                    disabled={flipping}
                    className="retro-btn"
                    style={flipping ? { opacity: 0.6 } : {}}
                >
                    {flipping ? (
                        <><span style={{ display: 'inline-block', animation: 'spin 0.6s linear infinite' }}>&#9654;</span> 翻牌中…</>
                    ) : (
                        <>&#9835; 隨機一聽</>
                    )}
                </button>

                {lastLabel && (
                    <div className="page-reveal" style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #c8b4a4' }}>
                        <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '8px', color: '#9a7860', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
                            已跳往
                        </p>
                        <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '10px', fontWeight: 'bold', color: 'var(--mood-accent)', letterSpacing: '0.05em' }}>
                            {lastLabel.date}
                        </p>
                        <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '10px', color: '#2a1808', fontWeight: 'bold', marginTop: '2px', lineHeight: 1.4 }}>
                            {lastLabel.artist}
                        </p>
                        <p style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '9px', color: '#7a5840', fontStyle: 'italic', lineHeight: 1.4 }}>
                            {lastLabel.album}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
