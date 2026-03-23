// src/components/RandomExplore.jsx
// 隨機探索 — 跳到資料庫中的一個隨機日期
import { useState } from 'react';

export const RandomExplore = ({ jazzData, onNavigate }) => {
    const [flipping, setFlipping] = useState(false);
    const [lastLabel, setLastLabel] = useState(null);

    const handleSpin = () => {
        if (flipping) return;
        const available = Object.keys(jazzData || {}).filter(k => jazzData[k] && jazzData[k].album);
        if (available.length === 0) return;

        setFlipping(true);
        setLastLabel(null);

        // 視覺倒數後跳頁
        setTimeout(() => {
            const pick = available[Math.floor(Math.random() * available.length)];
            const [y, m, d] = pick.split('-').map(Number);
            const artist = jazzData[pick].artist || '';
            const album = jazzData[pick].album || '';
            setLastLabel({ date: pick, artist, album });
            onNavigate(new Date(y, m - 1, d));
            setFlipping(false);
        }, 700);
    };

    return (
        <div className="mt-8 pt-6 border-t border-white/20 font-zen relative">
            {/* 標題標籤 */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-zinc-950 px-3 py-1 text-[10px] tracking-[0.2em] text-amber-500 font-bold uppercase border border-amber-500/50 whitespace-nowrap rounded shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                Random Explore
            </div>

            <div className="bg-zinc-900 p-4 shadow-lg border border-white/20 rounded-md">
                <p className="text-[11px] text-zinc-400 leading-relaxed mb-4 tracking-wide">
                    不知道聽什麼？<br />
                    讓命運替你選一張今日爵士。
                </p>

                <button
                    onClick={handleSpin}
                    disabled={flipping}
                    className="w-full py-3 bg-amber-500 text-zinc-950 text-[11px] font-black tracking-widest hover:bg-amber-400 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] disabled:opacity-50 transition-all rounded-sm uppercase flex items-center justify-center gap-2"
                >
                    {flipping ? (
                        <>
                            <span className="inline-block animate-spin">&#9654;</span>
                            翻牌中…
                        </>
                    ) : (
                        <>&#9835; 隨機一聽</>
                    )}
                </button>

                {lastLabel && (
                    <div className="mt-3 pt-3 border-t border-white/10 page-reveal">
                        <p className="text-[10px] text-zinc-500 tracking-widest mb-1 uppercase">已跳往</p>
                        <p className="text-[11px] text-amber-400 font-bold tracking-wide">{lastLabel.date}</p>
                        <p className="text-[11px] text-white font-medium mt-0.5 leading-snug">
                            {lastLabel.artist}
                        </p>
                        <p className="text-[10px] text-zinc-400 italic leading-snug">{lastLabel.album}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
