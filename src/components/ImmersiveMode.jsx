// src/components/ImmersiveMode.jsx
import { IconX, IconChevronLeft, IconChevronRight, IconDisc, IconPause, IconPlay } from './Icons';

export const ImmersiveMode = ({
    isImmersive,
    handleCloseImmersive,
    selectedDate,
    togglePlay,
    handlePrevDay,
    handleNextDay,
    youtubeId,
    currentData,
    isVinylSpinning
}) => {
    if (!isImmersive) return null;

    return (
        <div className="fixed inset-0 z-[200] immersive-bg text-stone-200 flex flex-col items-center justify-center immersive-overlay">
            <button onClick={handleCloseImmersive} className="absolute top-8 right-8 p-2 text-stone-500 hover:text-white transition-colors duration-300 z-50">
                <IconX size={32} />
                <span className="sr-only">Close</span>
            </button>

            <div className="w-full max-w-4xl flex flex-col items-center relative">
                <div className="text-stone-500 font-zen tracking-widest mb-12 text-sm uppercase">
                    {selectedDate.getFullYear()} . {selectedDate.toLocaleString('en-US', { month: 'long' })} . {selectedDate.getDate()}
                </div>

                <div 
                    className="relative w-[70vw] max-w-[450px] aspect-square flex items-center justify-center mb-12 group cursor-pointer"
                    onClick={togglePlay}
                >
                    <button onClick={(e) => {e.stopPropagation(); handlePrevDay();}} className="absolute -left-16 lg:-left-24 top-1/2 -translate-y-1/2 p-4 text-stone-600 hover:text-white transition opacity-50 hover:opacity-100 hover:scale-110 z-40"><IconChevronLeft size={40}/></button>
                    <button onClick={(e) => {e.stopPropagation(); handleNextDay();}} className="absolute -right-16 lg:-right-24 top-1/2 -translate-y-1/2 p-4 text-stone-600 hover:text-white transition opacity-50 hover:opacity-100 hover:scale-110 z-40"><IconChevronRight size={40}/></button>
                    
                    {youtubeId && (
                        <div className="absolute inset-0 z-0 opacity-0 pointer-events-none">
                            <div id="yt-player-mount"></div>
                        </div>
                    )}

                    <div className={`w-full h-full rounded-full shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-hidden relative z-10 border border-stone-800 transition-all duration-1000 ${isVinylSpinning ? 'animate-spin-vinyl' : ''}`}>
                        {currentData?.imageUrl ? (
                            <img src={currentData.imageUrl} className="w-full h-full object-cover opacity-90" alt="Album Cover" />
                        ) : (
                            <div className="w-full h-full bg-stone-900 flex items-center justify-center"><IconDisc size={100} className="text-stone-700"/></div>
                        )}
                        <div className="absolute inset-0 rounded-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                        <div className="absolute inset-0 rounded-full border-[1px] border-white/5"></div>
                    </div>
                    
                    <div className={`absolute inset-0 z-20 flex items-center justify-center rounded-full bg-black/30 transition-all duration-300 ${isVinylSpinning ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
                        <div className="w-20 h-20 rounded-full bg-stone-100/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-2xl transform transition-transform group-hover:scale-110">
                            {isVinylSpinning ? <IconPause size={32} /> : <IconPlay size={32} />}
                        </div>
                    </div>

                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-tr from-white/0 to-white/5 pointer-events-none rounded-tr-full z-20"></div>
                </div>

                <div className="text-center space-y-4 max-w-2xl px-6">
                    <h2 className="text-3xl lg:text-5xl font-playfair italic text-stone-100 leading-tight">
                        {currentData?.album || "No Album Data"}
                    </h2>
                    <p className="text-lg lg:text-xl text-amber-500/80 tracking-widest font-light">
                        {currentData?.artist || "Unknown Artist"}
                    </p>
                </div>
                
                <div className="mt-8 text-stone-600 text-xs tracking-[0.2em] uppercase font-bold opacity-60">
                    {isVinylSpinning ? "Now Spinning" : "Click Vinyl to Play"}
                </div>
            </div>
        </div>
    );
};