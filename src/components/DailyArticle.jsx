// src/components/DailyArticle.jsx
import { EditorNote } from './EditorNote';
import { IconDisc, StoneVinylIcon, IconArrowRight, IconQuote } from './Icons';

export const DailyArticle = ({
    currentData,
    selectedDate,
    tearDirection,
    isHoveringLink,
    setIsHoveringLink,
    youtubeId,
    setIsImmersive
}) => {
    if (!currentData) {
        return (
            <div className="flex flex-col items-center justify-center h-64 opacity-30 text-center">
                <IconDisc size={64} className="mb-4" />
                <p className="font-zen text-xl tracking-widest uppercase">本日無資料</p>
            </div>
        );
    }

    return (
        <div className={`relative w-full max-w-5xl mx-auto ${tearDirection === 'forward' ? 'tear-forward' : tearDirection === 'backward' ? 'tear-backward' : 'page-reveal'}`}>
            <div className="flex flex-col lg:flex-row items-baseline gap-6 mb-16 ml-0 lg:ml-12 relative z-20">
                <div className="font-playfair text-6xl lg:text-8xl font-black text-stone-900">
                    {selectedDate.getDate()}
                    <span className="text-2xl lg:text-3xl font-normal text-amber-700 ml-4 italic">
                        {selectedDate.toLocaleString('en-US', { month: 'long' })}
                    </span>
                </div>
                <div className="font-zen text-stone-500 text-lg">
                    {selectedDate.toLocaleDateString('zh-TW', { weekday: 'long' })}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
                <div className="lg:col-span-4 relative lg:translate-x-4 z-10">
                    <div className={`absolute top-1/2 -translate-y-1/2 right-0 w-[95%] aspect-square -z-10 transition-all duration-700 ease-in-out flex items-center justify-center ${isHoveringLink ? 'translate-x-[25%] opacity-100' : 'translate-x-0 opacity-0'}`}>
                        <IconDisc size="100%" isPureBlack={true} className="drop-shadow-[0_15px_35px_rgba(0,0,0,0.5)]" />
                    </div>
                    
                    <div className="relative group">
                        <div className="aspect-square w-full shadow-2xl relative bg-stone-800 overflow-hidden transition-transform duration-700 needle-drop z-10">
                            {currentData.imageUrl ? (
                                <img src={currentData.imageUrl} className="absolute inset-0 w-full h-full object-cover" alt="Album Cover" />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center opacity-20">
                                    <IconDisc size={200} className="text-white" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                            <div className="absolute bottom-0 left-0 p-6 w-full text-white">
                                <p className="text-xs font-bold tracking-widest uppercase mb-1 text-amber-400">Now Playing</p>
                                <h2 className="text-2xl lg:text-3xl font-playfair italic leading-tight">{currentData.album}</h2>
                                <p className="text-base lg:text-lg mt-2 font-light tracking-wider">{currentData.artist}</p>
                            </div>
                        </div>
                        
                        {youtubeId && (
                            <button 
                                onClick={() => setIsImmersive(true)} 
                                className="absolute -top-14 right-0 z-30 flex items-center gap-3 px-4 py-2 text-stone-500 hover:text-stone-800 text-sm font-bold tracking-[0.1em] transition-all duration-300 hover:scale-105 border-b-2 border-transparent hover:border-amber-600 font-zen"
                            >
                                <StoneVinylIcon size={24} />
                                <span>進入黑膠模式</span>
                            </button>
                        )}
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-2" onMouseEnter={() => setIsHoveringLink(true)} onMouseLeave={() => setIsHoveringLink(false)}>
                        {currentData.youtube && <a href={currentData.youtube} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-red-800 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-red-700 transition-all hover:translate-x-1">YOUTUBE <IconArrowRight size={14}/></a>}
                        {currentData.spotify && <a href={currentData.spotify} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-green-800 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-green-700 transition-all hover:translate-x-1">SPOTIFY <IconArrowRight size={14}/></a>}
                        {currentData.appleMusic && <a href={currentData.appleMusic} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-stone-800 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-stone-700 transition-all hover:translate-x-1">APPLE MUSIC <IconArrowRight size={14}/></a>}
                        {currentData.other && <a href={currentData.other} target="_blank" rel="noreferrer" className="px-4 py-2.5 bg-slate-600 text-white text-[10px] tracking-[0.2em] font-bold hover:bg-slate-500 transition-all hover:translate-x-1">OTHER <IconArrowRight size={14}/></a>}
                    </div>
                </div>
                
                <div className="lg:col-span-8 lg:pl-12">
                    {currentData?.editorNote?.trim() && (
                        <div className="mb-10 lg:hidden">
                            <EditorNote note={currentData.editorNote} />
                        </div>
                    )}

                    <IconQuote className="text-amber-600/20 mb-6" />
                    <div className="prose prose-stone font-zen leading-relaxed text-stone-700 whitespace-pre-line text-lg">
                        {currentData.content}
                    </div>
                </div>
            </div>
        </div>
    );
};