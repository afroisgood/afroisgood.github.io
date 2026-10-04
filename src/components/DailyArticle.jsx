// src/components/DailyArticle.jsx
import { useState, useEffect, useRef } from 'react';
import { EditorNote } from './EditorNote';
import { IconDisc, IconArrowRight, IconQuote, IconShare, IconCheck } from './Icons';
import { VintageJazzText } from './VintageJazzText';
import { formatDateString } from '../utils/dateUtils';

export const DailyArticle = ({
    currentData,
    selectedDate,
    youtubeId,
    setIsImmersive,
    className = '',
}) => {
    const [isCopied, setIsCopied] = useState(false);
    const copyTimerRef = useRef(null);

    useEffect(() => {
        return () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); };
    }, []);

    const dateKey = formatDateString(selectedDate);

    const handleShare = async () => {
        // 分享出去的訊息常在隔天以後才被點開，日期一律寫明、網址帶上日期，對方才會看到同一張專輯
        const dateText = `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`;

        const shareData = {
            title: `JAZZ 365 | ${dateText}`,
            text: `${dateText}的爵士推薦是 ${currentData.artist} 的《${currentData.album}》，來聽看看吧`,
            url: `${window.location.origin}${window.location.pathname}#${dateKey}`,
        };

        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.log('分享取消', err); }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
                setIsCopied(true);
                if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
                copyTimerRef.current = setTimeout(() => setIsCopied(false), 2000);
            } catch (err) { console.error('複製失敗', err); }
        }
    };

    const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long' });

    // 專輯名長短差很多（多數 ≤18 字，少數超過 30 字），大標字級跟著長度往下調，避免長標題變成好幾行巨字
    const headline = currentData?.album || currentData?.song || '';
    const isLongHeadline = headline.length > 30;
    const headlineSize = isLongHeadline
        ? 'text-xl lg:text-3xl'
        : headline.length > 18
            ? 'text-2xl lg:text-4xl'
            : 'text-3xl lg:text-5xl';

    if (!currentData) {
        return (
            <div className={`relative w-full max-w-5xl mx-auto ${className}`}>
                <div className="relative flex flex-col items-center justify-center min-h-[65vh] text-center overflow-hidden px-6">

                    {/* 大日期水印背景 */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                        <span className="font-playfair text-[16rem] lg:text-[22rem] font-black text-stone-900 leading-none opacity-[0.04]">
                            {String(selectedDate.getDate()).padStart(2, '0')}
                        </span>
                    </div>

                    {/* 頂部裝飾線 */}
                    <div className="relative z-10 w-full max-w-xs mb-12">
                        <div className="flex items-center gap-4">
                            <div className="flex-1 h-[1px] bg-stone-900/20"></div>
                            <span className="text-[9px] tracking-[0.4em] text-stone-500/60 font-bold uppercase">
                                {String(selectedDate.getDate()).padStart(2, '0')} {monthName.toUpperCase()}
                            </span>
                            <div className="flex-1 h-[1px] bg-stone-900/20"></div>
                        </div>
                    </div>

                    {/* 旋轉黑膠 */}
                    <div className="relative z-10 mb-10">
                        <IconDisc size={88} className="text-stone-500/30 animate-spin-slow" />
                    </div>

                    {/* 主標題 */}
                    <div className="relative z-10 mb-6">
                        <h2 className="font-playfair text-4xl lg:text-5xl font-black tracking-tight uppercase text-stone-500/50 mb-3">
                            Rest & Listen
                        </h2>
                        <p className="font-zen text-xs tracking-[0.3em] text-stone-500/40">
                            本日無推薦曲目
                        </p>
                    </div>

                    {/* 爵士引言 */}
                    <div className="relative z-10 max-w-xs mt-4">
                        <p className="font-serif text-stone-500/40 text-base italic leading-relaxed">
                            "Music is the silence between the notes."
                        </p>
                        <p className="text-[9px] tracking-[0.3em] text-stone-500/30 mt-3 uppercase">
                            — Claude Debussy
                        </p>
                    </div>

                    {/* 底部裝飾點 */}
                    <div className="relative z-10 mt-14 flex items-center gap-2">
                        <span className="w-1 h-1 rounded-full bg-stone-500/20"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500/30"></span>
                        <span className="w-1 h-1 rounded-full bg-stone-500/20"></span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative w-full max-w-5xl mx-auto ${className}`}>
            {/* 封面在左、所有資訊收在右側 —— 日期／專輯／藝人只出現一次；日文原文與翻譯只留在後台，前台不公開 */}
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
                {/* 復古爵士海報文字裝飾：散落在右半邊，只在桌機＋短標題時顯示 */}
                {!isLongHeadline && (
                    <div className="hidden lg:block absolute inset-0 pointer-events-none">
                        <VintageJazzText />
                    </div>
                )}

                {/* 左側：專輯封面 */}
                <div className="lg:col-span-5 relative z-10 w-full max-w-sm mx-auto lg:max-w-none">
                    <div className="aspect-square w-full relative bg-stone-200 overflow-hidden group retro-album-frame">
                        {currentData.imageUrl ? (
                            <img
                                src={currentData.imageUrl}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                alt={currentData.album}
                            />
                        ) : youtubeId ? (
                            <img
                                src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                alt={currentData.album}
                                onError={(e) => {
                                    if (e.target.src.includes('maxresdefault.jpg')) e.target.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                                    else if (e.target.src.includes('hqdefault.jpg')) e.target.src = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
                                    else if (e.target.src.includes('mqdefault.jpg')) e.target.src = `https://img.youtube.com/vi/${youtubeId}/default.jpg`;
                                }}
                            />
                        ) : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 bg-[#EFECE5]">
                                <IconDisc size={64} className="opacity-20 mb-4" />
                                <span className="text-xs font-bold tracking-widest uppercase opacity-50">No Image Source</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 右側：日期、專輯、藝人、石編的話、聆聽入口 */}
                <div className="lg:col-span-7 relative z-10 flex flex-col gap-5">
                    <header className="flex flex-col gap-3">
                        <div className="flex items-baseline gap-3">
                            <span className="font-playfair text-6xl lg:text-7xl font-black text-stone-900 tracking-tighter leading-none [font-variant-numeric:lining-nums]">
                                {String(selectedDate.getDate()).padStart(2, '0')}
                            </span>
                            <span className="text-2xl lg:text-3xl font-playfair italic transition-colors duration-1000" style={{ color: 'var(--mood-accent)' }}>
                                {monthName}
                            </span>
                        </div>
                        <h2 className={`${headlineSize} font-black tracking-tight text-stone-900 font-playfair leading-[1.1] uppercase [overflow-wrap:anywhere] [text-wrap:balance]`}>
                            {headline}
                        </h2>
                        <p className="text-sm lg:text-base font-bold tracking-widest text-stone-800 uppercase leading-relaxed">
                            {currentData.artist}
                        </p>
                        {currentData.song && currentData.album && (
                            <p className="text-sm font-bold tracking-widest text-stone-600 italic font-serif">
                                ♪ “{currentData.song}”
                            </p>
                        )}
                    </header>

                    {currentData?.editorNote?.trim() && (
                        <EditorNote note={currentData.editorNote} />
                    )}

                    <div className="h-[2px] bg-stone-900/80 mt-1"></div>

                    {youtubeId && (
                        <button
                            onClick={() => setIsImmersive(true)}
                            className="w-full flex items-center justify-center gap-3"
                            style={{
                                minHeight: '56px',
                                fontSize: '12px',
                                letterSpacing: '0.25em',
                                fontFamily: "'Courier New', Courier, monospace",
                                fontWeight: 'bold',
                                background: '#fde8cc',
                                color: '#9a4a10',
                                border: '2px solid #f5c49a',
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#fbd9a8'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fde8cc'}
                        >
                            <IconDisc className="animate-spin-slow" size={18} />
                            VINYL LISTENING
                        </button>
                    )}

                    {/* 串流按鈕 — retro OS style */}
                    <div>
                                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {currentData.youtube && (
                                <a href={currentData.youtube} target="_blank" rel="noreferrer" className="retro-stream retro-stream-yt">
                                    YOUTUBE <IconArrowRight size={12}/>
                                </a>
                            )}
                            {currentData.spotify && (
                                <a href={currentData.spotify} target="_blank" rel="noreferrer" className="retro-stream retro-stream-sp">
                                    SPOTIFY <IconArrowRight size={12}/>
                                </a>
                            )}
                            {currentData.appleMusic && (
                                <a href={currentData.appleMusic} target="_blank" rel="noreferrer" className="retro-stream retro-stream-am">
                                    APPLE MUSIC <IconArrowRight size={12}/>
                                </a>
                            )}
                            {currentData.other && (
                                <a href={currentData.other} target="_blank" rel="noreferrer" className="retro-stream">
                                    OTHER <IconArrowRight size={12}/>
                                </a>
                            )}
                            <button
                                onClick={handleShare}
                                className={`retro-stream ${isCopied ? 'retro-stream-copied' : ''} ${(!currentData.youtube && !currentData.spotify && !currentData.appleMusic && !currentData.other) ? 'col-span-2 sm:col-span-3' : ''}`}
                            >
                                {isCopied ? 'COPIED!' : 'SHARE'}
                                {isCopied ? <IconCheck size={12}/> : <IconShare size={12}/>}
                            </button>
                        </div>
                    </div>

                    {currentData?.albumNotes?.trim() && (
                        <section aria-labelledby={`album-notes-${dateKey}`} className="mt-3 pt-4 border-t-2 border-stone-900/70">
                            <h3 id={`album-notes-${dateKey}`} className="font-mono text-[11px] tracking-[0.3em] text-stone-600 uppercase mb-2">Album Notes · 專輯資訊</h3>
                            <p className="font-zen text-sm leading-relaxed text-stone-800 tracking-wide whitespace-pre-line">{currentData.albumNotes}</p>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
};
