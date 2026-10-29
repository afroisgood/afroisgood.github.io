import { useEffect, useState } from 'react';

export const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// 只有播放畫面在時才輪詢 YouTube 播放時間（唱臂與進度條共用）；沉浸模式與唱片行唱盤都用
export const usePlaybackTime = (player, enabled) => {
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
