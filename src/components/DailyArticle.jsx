// src/components/DailyArticle.jsx
import { useState } from 'react';
import { EditorNote } from './EditorNote';
import { IconDisc, IconArrowRight, IconQuote, IconShare, IconCheck } from './Icons';
import { VintageJazzText } from './VintageJazzText';

export const DailyArticle = ({
    currentData,
    selectedDate,
    tearDirection,
    youtubeId,
    setIsImmersive
}) => {
    const [isCopied, setIsCopied] = useState(false);

    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    const handleShare = async () => {
        const now = new Date();
        const isToday = selectedDate.getFullYear() === now.getFullYear() &&
                        selectedDate.getMonth() === now.getMonth() &&
                        selectedDate.getDate() === now.getDate();
        
        const dateText = isToday ? '今天' : `${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`;

        const shareData = {
            title: `日めくりジャズ365 | ${selectedDate.getMonth() + 1}月${selectedDate.getDate()}日`,
            text: `🎵 ${dateText}的爵士推薦是 ${currentData.artist} 的《${currentData.album}》！快來聽聽看：`,
            url: window.location.href, 
        };

        if (navigator.share) {
            try { await navigator.share(shareData); } catch (err) { console.log('分享取消', err); }
        } else {
            try {
                await navigator.clipboard.writeText(`${shareData.text} \n${shareData.url}`);
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000); 
            } catch (err) { console.error('複製失敗', err); }
        }
    };

    const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long' });

    if (!currentData) {
        return (
            <div className={`relative w-full max-w-5xl mx-auto transition-all duration-700 ease-out ${tearDirection === 'forward' ? 'opacity-0 -translate-x-10' : tearDirection === 'backward' ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}>
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
        <div className={`relative w-full max-w-5xl mx-auto transition-all duration-700 ease-out ${tearDirection === 'forward' ? 'opacity-0 -translate-x-10' : tearDirection === 'backward' ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}>

            {/* 復古爵士海報文字裝飾 */}
            <VintageJazzText />

            {/* 藝廊風獨立大標題 */}
            <header className="mb-10 lg:mb-16">
                <div className="flex items-baseline gap-4 mb-4">
                    <span className="font-playfair text-6xl lg:text-8xl font-black text-stone-900 tracking-tighter">
                        {String(selectedDate.getDate()).padStart(2, '0')}
                    </span>
                    <span className="text-2xl lg:text-3xl font-playfair italic transition-colors duration-1000" style={{ color: 'var(--mood-accent)' }}>
                        {monthName}
                    </span>
                </div>
                <h2 className="text-4xl lg:text-6xl font-black tracking-tighter text-stone-900 font-playfair leading-[1.1] uppercase drop-shadow-sm">
                    {currentData.song}
                </h2>
                <div className="mt-4 flex flex-col lg:flex-row lg:items-center gap-2 lg:gap-6">
                    <p className="text-xl lg:text-2xl font-bold tracking-widest text-stone-800 uppercase">
                        {currentData.artist}
                    </p>
                    <div className="hidden lg:block w-12 h-[2px] transition-colors duration-1000" style={{ backgroundColor: 'var(--mood-accent)', opacity: 0.5 }}></div>
                    <p className="text-sm font-bold tracking-widest text-stone-500 italic font-serif">
                        From the album "{currentData.album}"
                    </p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

                {/* 左側：專輯封面（純粹視覺焦點） */}
                <div className="lg:col-span-5 relative z-10">
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

                        {youtubeId && (
                            <button
                                onClick={() => setIsImmersive(true)}
                                className="retro-btn absolute bottom-3 right-3"
                                style={{ width: 'auto', padding: '4px 10px', fontSize: '9px', letterSpacing: '0.12em', gap: '4px' }}
                            >
                                <IconDisc className="animate-spin-slow" size={12} />
                                VINYL
                            </button>
                        )}
                    </div>
                </div>

                {/* 右側：引言、內文、串流按鈕 */}
                <div className="lg:col-span-7 flex flex-col justify-between pt-2 min-h-[420px]">
                    <div className="flex-1">
                        {currentData?.editorNote?.trim() && (
                            <div className="mb-10 lg:hidden">
                                <EditorNote note={currentData.editorNote} />
                            </div>
                        )}

                        <div className="relative pl-8 mb-10">
                            <span className="absolute left-0 -top-2 text-6xl font-serif leading-none transition-colors duration-1000" style={{ color: 'var(--mood-accent)', opacity: 0.35 }}>"</span>
                            <blockquote className="text-xl lg:text-2xl font-medium text-stone-900 leading-relaxed font-serif text-justify pt-2">
                                {currentData.quote}
                            </blockquote>
                        </div>

                        <div className="prose prose-stone font-zen leading-relaxed text-stone-700 whitespace-pre-line text-[15px] lg:text-base">
                            {currentData.content}
                        </div>
                    </div>

                    {/* 串流按鈕 — retro OS style */}
                    <div className="mt-10" style={{ paddingTop: '20px', borderTop: '2px solid', borderTopColor: '#c8b4a4' }}>
                        <div className="grid grid-cols-2 gap-2">
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
                                className={`retro-stream ${isCopied ? 'retro-stream-copied' : ''} ${(!currentData.youtube && !currentData.spotify && !currentData.appleMusic && !currentData.other) ? 'col-span-2' : ''}`}
                            >
                                {isCopied ? 'COPIED!' : 'SHARE'}
                                {isCopied ? <IconCheck size={12}/> : <IconShare size={12}/>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};