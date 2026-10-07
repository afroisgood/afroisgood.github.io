// src/components/ImmersiveMode.jsx
// 沉浸模式：唱盤。唱片以封面當中心圓標旋轉，唱臂在開始播放後落下並隨進度往內圈移、播完或無法播放時抬起；
// 側欄放完整正方形封面、播放狀態、進度條與前一天／播放／下一天。
import { useEffect, useState } from 'react';
import { IconX, IconMinimize, IconDisc, IconPause, IconPlay, IconSkipBack, IconSkipForward, IconArrowRight } from './Icons';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// 唱臂角度：架上、唱片最外圈、最內圈（標籤外緣）。依轉盤幾何換算，播放進度 0→1 對應外圈→內圈
const ARM_REST_DEG = -6;
const ARM_OUTER_DEG = 9;
const ARM_INNER_DEG = 29;

// 只有沉浸模式畫面在時才輪詢 YouTube 播放時間（唱臂與進度條共用）
const usePlaybackTime = (player, enabled) => {
    const [time, setTime] = useState({ current: 0, duration: 0 });

    useEffect(() => {
        if (!player || !enabled) return;
        const id = setInterval(() => {
            // YT.Player 物件一建立就拿得到，但 getCurrentTime 等方法要等播放器 ready 才會掛上
            if (typeof player.getCurrentTime !== 'function') return;
            try {
                setTime({ current: player.getCurrentTime() || 0, duration: player.getDuration() || 0 });
            } catch { /* 播放器切換影片中，下一輪再讀 */ }
        }, 500);
        return () => clearInterval(id);
    }, [player, enabled]);

    return [time, setTime];
};

const PlaybackProgress = ({ player, time, setTime, disabled }) => {
    const { current, duration } = time;
    const canSeek = !disabled && duration > 0;
    const pct = canSeek ? Math.min(100, (current / duration) * 100) : 0;

    const handleSeek = (e) => {
        const target = Number(e.target.value);
        try { player.seekTo(target, true); } catch { /* 播放器尚未就緒 */ }
        setTime(prev => ({ ...prev, current: target }));
    };

    return (
        <div className="flex flex-col gap-2">
            <input
                type="range"
                min={0}
                max={canSeek ? Math.floor(duration) : 0}
                step={1}
                value={canSeek ? Math.floor(Math.min(current, duration)) : 0}
                onChange={handleSeek}
                disabled={!canSeek}
                aria-label="播放進度"
                aria-valuetext={`${formatTime(current)} / ${formatTime(duration)}`}
                className="turntable-range"
                style={{ '--progress': `${pct}%` }}
            />
            <div className="flex justify-between font-courier text-xs text-[#a8a0c8]">
                <span>{canSeek ? formatTime(current) : '00:00'}</span>
                <span>{canSeek ? formatTime(duration) : '--:--'}</span>
            </div>
        </div>
    );
};

const STREAM_LINKS = [
    { key: 'youtube', label: 'YOUTUBE', cls: 'retro-stream-yt' },
    { key: 'spotify', label: 'SPOTIFY', cls: 'retro-stream-sp' },
    { key: 'appleMusic', label: 'APPLE MUSIC', cls: 'retro-stream-am' },
    { key: 'other', label: 'OTHER', cls: '' },
];

export const ImmersiveMode = ({
    isImmersive,
    isMinimized,
    handleCloseImmersive,
    handleMinimizeImmersive,
    selectedDate,
    togglePlay,
    handlePrevDay,
    handleNextDay,
    currentData,
    youtubeId,
    player,
    playerState,
    isVinylSpinning,
    playerError,
}) => {
    const isOpen = isImmersive && !isMinimized;
    const [time, setTime] = usePlaybackTime(player, isOpen);
    if (!isOpen) return null;

    const hasVideo = Boolean(currentData && youtubeId);
    const unavailable = Boolean(playerError) || !hasVideo;
    const canPlay = hasVideo && !playerError && Boolean(player);
    // 唱臂只在真的開始播過（播放中／暫停／緩衝）時落在唱片上，並隨播放進度由外圈往內圈移；播完（狀態 0）回到架上
    const armOnRecord = !unavailable && [1, 2, 3].includes(playerState);
    const progress = time.duration > 0 ? Math.min(1, Math.max(0, time.current / time.duration)) : 0;
    const armAngle = armOnRecord ? ARM_OUTER_DEG + (ARM_INNER_DEG - ARM_OUTER_DEG) * progress : ARM_REST_DEG;

    const coverUrl = currentData?.imageUrl || (youtubeId ? `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg` : '');
    const dateLabel = `${selectedDate.getFullYear()}.${String(selectedDate.getMonth() + 1).padStart(2, '0')}.${String(selectedDate.getDate()).padStart(2, '0')} ${WEEKDAYS[selectedDate.getDay()]}`;

    const status = playerError ? 'UNAVAILABLE'
        : !hasVideo ? 'NO RECORD'
        : playerState === 1 ? 'NOW SPINNING'
        : playerState === 3 ? 'CUEING…'
        : playerState === 2 ? 'PAUSED'
        : playerState === 0 ? 'SIDE ENDED'
        : 'READY';

    const unavailableMessage = !currentData
        ? '本日無推薦曲目。'
        : (playerError === 101 || playerError === 150)
            ? '這張唱片的版權方不允許在網站內播放，請到串流平台收聽：'
            : playerError
                ? `影片無法播放（錯誤 ${playerError}），請到串流平台收聽：`
                : '這一天沒有可以直接播放的影片，請到串流平台收聽：';
    const streamLinks = currentData ? STREAM_LINKS.filter(l => currentData[l.key]) : [];

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-label="黑膠聆聽"
            className="fixed inset-0 z-[200] retro-desktop flex flex-col overflow-y-auto text-[#d0c8e8] immersive-overlay"
        >
            {/* 頂列 */}
            <div className="h-16 lg:h-[72px] shrink-0 flex items-center justify-between px-4 lg:px-8">
                <div className="flex items-baseline gap-4 font-courier text-[13px]">
                    <span className="hidden sm:inline font-bold tracking-[0.3em] text-[#c8a048]">VINYL LISTENING</span>
                    <span className="tracking-[0.2em] text-[#c8a048] sm:text-[#8a86a8]">{dateLabel}</span>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={handleMinimizeImmersive}
                        aria-label="縮小，繼續閱讀文章"
                        title="縮小，繼續閱讀文章"
                        className="w-11 h-11 flex items-center justify-center bg-[#10121e] border border-[#2a2d48] text-[#d0c8e8] hover:border-[#c8a048] transition-colors"
                    >
                        <IconMinimize size={20} />
                    </button>
                    <button
                        type="button"
                        onClick={handleCloseImmersive}
                        aria-label="關閉"
                        title="關閉"
                        className="w-11 h-11 flex items-center justify-center bg-[#10121e] border border-[#2a2d48] text-[#d0c8e8] hover:border-[#c8a048] transition-colors"
                    >
                        <IconX size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex items-center justify-center px-4 pb-6 lg:px-8 lg:pb-10">
                {/* 唱盤底座 */}
                <div className="immersive-content w-full max-w-[1040px] flex flex-col lg:flex-row items-center gap-8 lg:gap-14 p-5 lg:p-10 bg-[#1c1410] rounded-md border-[3px] border-t-[#c8a048] border-l-[#c8a048] border-r-[#3a2808] border-b-[#3a2808] shadow-[0_30px_80px_rgba(0,0,0,0.6)]">

                    {/* 轉盤＋唱片＋唱臂（位置都用百分比，跟著轉盤大小等比縮放） */}
                    <div className="relative w-[min(78vw,420px)] lg:w-[520px] aspect-square shrink-0" aria-hidden="true">
                        <div className="absolute inset-0 rounded-full bg-[#121212] border-2 border-[#3a3a3a]"></div>
                        <div
                            className="absolute inset-[3.85%] rounded-full vinyl-grooves vinyl-spin flex items-center justify-center shadow-[0_6px_20px_rgba(0,0,0,0.6)]"
                            style={{ animationPlayState: isVinylSpinning ? 'running' : 'paused' }}
                        >
                            <div className="relative w-1/3 aspect-square rounded-full overflow-hidden bg-[#22323f]">
                                {coverUrl ? (
                                    <img src={coverUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#5a5e80]"><IconDisc size={40} /></div>
                                )}
                                <span className="absolute left-1/2 top-1/2 w-[7%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0a0c18]"></span>
                            </div>
                        </div>
                        <div
                            className="tonearm absolute w-2 bg-[#b8bccc]"
                            style={{ left: 'calc(96.15% - 4px)', top: '7.7%', height: '61.9%', transform: `rotate(${armAngle}deg)` }}
                        >
                            <div className="absolute -left-2 -bottom-[18px] w-6 h-8 bg-[#c8a048] border border-[#3a2808]"></div>
                        </div>
                        <div className="absolute left-[90%] top-[1.55%] w-[12.3%] aspect-square rounded-full bg-[#2a2d48] border-[3px] border-[#c8a048]"></div>
                    </div>

                    {/* 資訊與控制 */}
                    <div className="w-full lg:flex-1 min-w-0 flex flex-col gap-4 lg:gap-[18px]">
                        <div className="hidden lg:block w-[132px] aspect-square bg-[#22323f] shadow-[0_8px_20px_rgba(0,0,0,0.5)]">
                            {coverUrl && <img src={coverUrl} alt={currentData?.album ? `${currentData.album} 封面` : ''} className="w-full h-full object-cover" />}
                        </div>

                        <p className="flex items-center gap-2 font-courier text-xs font-bold tracking-[0.25em] text-[#c8a048]">
                            <span className={`w-2 h-2 rounded-full ${isVinylSpinning ? 'bg-[#e0a870] animate-pulse' : 'bg-[#5a5e80]'}`}></span>
                            {status}
                        </p>

                        <div className="flex flex-col gap-2">
                            <h2 className="font-playfair font-black text-2xl lg:text-4xl leading-[1.1] text-[#f2ece3] uppercase [overflow-wrap:anywhere] [text-wrap:balance]">
                                {currentData?.album || currentData?.song || 'Rest & Listen'}
                            </h2>
                            {currentData?.artist && (
                                <p className="font-tc text-sm lg:text-base tracking-[0.15em] text-[#e0a870] uppercase">{currentData.artist}</p>
                            )}
                        </div>

                        {unavailable ? (
                            <div className="flex flex-col gap-2.5 p-4 bg-[#10121e] border border-[#3a2d20]">
                                <p className="font-tc text-sm leading-relaxed text-[#f2ece3]">{unavailableMessage}</p>
                                {streamLinks.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                        {streamLinks.map(link => (
                                            <a
                                                key={link.key}
                                                href={currentData[link.key]}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`retro-stream ${link.cls}`}
                                            >
                                                {link.label} <IconArrowRight size={12} />
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <PlaybackProgress player={player} time={time} setTime={setTime} disabled={!canPlay} />
                        )}

                        <div className="flex items-center justify-center lg:justify-start gap-[18px] mt-1">
                            <button
                                type="button"
                                onClick={handlePrevDay}
                                aria-label="前一天"
                                title="前一天"
                                className="w-[52px] h-[52px] rounded-full flex items-center justify-center bg-[#10121e] border border-[#3a2d20] text-[#d0c8e8] hover:border-[#c8a048] transition-colors"
                            >
                                <IconSkipBack size={20} />
                            </button>
                            <button
                                type="button"
                                onClick={togglePlay}
                                disabled={!canPlay}
                                aria-label={isVinylSpinning ? '暫停' : '播放'}
                                title={isVinylSpinning ? '暫停' : '播放'}
                                className="w-[72px] h-[72px] rounded-full flex items-center justify-center bg-[#c8a048] text-[#1c1410] hover:bg-[#e0b860] transition-colors disabled:opacity-35 disabled:cursor-default disabled:hover:bg-[#c8a048]"
                            >
                                {isVinylSpinning ? <IconPause size={26} /> : <IconPlay size={26} />}
                            </button>
                            <button
                                type="button"
                                onClick={handleNextDay}
                                aria-label="下一天"
                                title="下一天"
                                className="w-[52px] h-[52px] rounded-full flex items-center justify-center bg-[#10121e] border border-[#3a2d20] text-[#d0c8e8] hover:border-[#c8a048] transition-colors"
                            >
                                <IconSkipForward size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
