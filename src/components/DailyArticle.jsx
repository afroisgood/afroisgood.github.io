// src/components/DailyArticle.jsx
import { useState } from 'react';
import { EditorNote } from './EditorNote';
import { IconDisc, IconArrowRight, IconQuote, IconShare, IconCheck } from './Icons';

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

    if (!currentData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 opacity-30 text-center text-stone-900">
                <IconDisc size={64} className="mb-4" />
                <p className="font-zen text-xl tracking-widest uppercase">本日無資料</p>
            </div>
        );
    }

    const monthName = selectedDate.toLocaleDateString('en-US', { month: 'long' });

    return (
        <div className={`relative w-full max-w-5xl mx-auto transition-all duration-700 ease-out ${tearDirection === 'forward' ? 'opacity-0 -translate-x-10' : tearDirection === 'backward' ? 'opacity-0 translate-x-10' : 'opacity-100 translate-x-0'}`}>
            
            {/* 藝廊風獨立大標題 */}
            <header className="mb-10 lg:mb-16">
                <div className="flex items-baseline gap-4 mb-4">
                    <span className="font-playfair text-6xl lg:text-8xl font-black text-stone-900 tracking-tighter">
                        {String(selectedDate.getDate()).padStart(2, '0')}
                    </span>
                    <span className="text-2xl lg:text-3xl font-playfair italic text-amber-700">
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
                    <div className="hidden lg:block w-12 h-[2px] bg-amber-700/50"></div>
                    <p className="text-sm font-bold tracking-widest text-stone-500 italic font-serif">
                        From the album "{currentData.album}"
                    </p>
                </div>
            </header>

            <div className=”grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start”>

                {/* 左側：專輯封面（純粹視覺焦點） */}
                <div className=”lg:col-span-5 relative z-10”>
                    <div className=”aspect-square w-full shadow-[0_20px_40px_rgba(0,0,0,0.12)] relative bg-stone-200 overflow-hidden group rounded-sm border border-stone-200/50”>

                        {currentData.imageUrl ? (
                            <img
                                src={currentData.imageUrl}
                                className=”w-full h-full object-cover transition-transform duration-700 group-hover:scale-105”
                                alt={currentData.album}
                            />
                        ) : youtubeId ? (
                            <img
                                src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
                                className=”w-full h-full object-cover transition-transform duration-700 group-hover:scale-105”
                                alt={currentData.album}
                                onError={(e) => {
                                    if (e.target.src.includes('maxresdefault.jpg')) e.target.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
                                    else if (e.target.src.includes('hqdefault.jpg')) e.target.src = `https://img.youtube.com/vi/${youtubeId}/mqdefault.jpg`;
                                    else if (e.target.src.includes('mqdefault.jpg')) e.target.src = `https://img.youtube.com/vi/${youtubeId}/default.jpg`;
                                }}
                            />
                        ) : (
                            <div className=”absolute inset-0 flex flex-col items-center justify-center text-stone-400 bg-[#EFECE5]”>
                                <IconDisc size={64} className=”opacity-20 mb-4” />
                                <span className=”text-xs font-bold tracking-widest uppercase opacity-50”>No Image Source</span>
                            </div>
                        )}

                        {youtubeId && (
                            <button
                                onClick={() => setIsImmersive(true)}
                                className=”absolute bottom-4 right-4 bg-white/95 backdrop-blur-sm text-stone-900 px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 text-[10px] font-black tracking-widest uppercase hover:bg-stone-900 hover:text-white transition-all hover:scale-105”
                            >
                                <IconDisc className=”animate-spin-slow” size={16} />
                                Vinyl Mode
                            </button>
                        )}
                    </div>
                </div>

                {/* 右側：引言、內文、串流按鈕 */}
                <div className=”lg:col-span-7 flex flex-col justify-between pt-2 min-h-[420px]”>
                    <div className=”flex-1”>
                        {currentData?.editorNote?.trim() && (
                            <div className=”mb-10 lg:hidden”>
                                <EditorNote note={currentData.editorNote} />
                            </div>
                        )}

                        <div className=”relative pl-8 mb-10”>
                            <span className=”absolute left-0 -top-2 text-6xl text-amber-700/30 font-serif leading-none”>”</span>
                            <blockquote className=”text-xl lg:text-2xl font-medium text-stone-900 leading-relaxed font-serif text-justify pt-2”>
                                {currentData.quote}
                            </blockquote>
                        </div>

                        <div className=”prose prose-stone font-zen leading-relaxed text-stone-700 whitespace-pre-line text-[15px] lg:text-base”>
                            {currentData.content}
                        </div>
                    </div>

                    {/* 串流按鈕：固定在右側底部 */}
                    <div className=”mt-10 pt-8 border-t border-stone-300/50”>
                        <div className=”grid grid-cols-2 gap-3”>
                            {currentData.youtube && <a href={currentData.youtube} target=”_blank” rel=”noreferrer” className=”flex items-center justify-between px-4 py-3 bg-red-800 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-red-700 transition-all hover:translate-x-1 rounded-sm shadow-sm”>YOUTUBE <IconArrowRight size={14}/></a>}
                            {currentData.spotify && <a href={currentData.spotify} target=”_blank” rel=”noreferrer” className=”flex items-center justify-between px-4 py-3 bg-green-800 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-green-700 transition-all hover:translate-x-1 rounded-sm shadow-sm”>SPOTIFY <IconArrowRight size={14}/></a>}
                            {currentData.appleMusic && <a href={currentData.appleMusic} target=”_blank” rel=”noreferrer” className=”flex items-center justify-between px-4 py-3 bg-stone-800 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-stone-700 transition-all hover:translate-x-1 rounded-sm shadow-sm”>APPLE MUSIC <IconArrowRight size={14}/></a>}
                            {currentData.other && <a href={currentData.other} target=”_blank” rel=”noreferrer” className=”flex items-center justify-between px-4 py-3 bg-slate-600 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-slate-500 transition-all hover:translate-x-1 rounded-sm shadow-sm”>OTHER <IconArrowRight size={14}/></a>}

                            <button
                                onClick={handleShare}
                                className={`flex items-center justify-between px-4 py-3 transition-all hover:translate-x-1 text-[10px] tracking-[0.2em] font-bold rounded-sm shadow-sm ${isCopied ? 'bg-amber-600 text-white' : 'bg-stone-200 text-stone-800 hover:bg-stone-300'} ${(!currentData.youtube && !currentData.spotify && !currentData.appleMusic && !currentData.other) ? 'col-span-2' : ''}`}
                            >
                                {isCopied ? 'COPIED!' : 'SHARE'}
                                {isCopied ? <IconCheck size={14}/> : <IconShare size={14}/>}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};