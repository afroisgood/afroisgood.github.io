// src/hooks/useYouTubePlayer.js
import { useState, useEffect, useRef, useCallback } from 'react';

// 所有 hook 實例共用同一個「API 就緒」promise，避免重複插入 script tag，
// 也讓延遲建立播放器的邏輯可以用 cancelled flag 取消，而不是链式覆寫全域 callback。
let ytApiReadyPromise = null;
const loadYouTubeApi = () => {
    if (!ytApiReadyPromise) {
        ytApiReadyPromise = new Promise((resolve) => {
            if (window.YT && window.YT.Player) {
                resolve();
                return;
            }
            const prevCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (prevCallback) prevCallback();
                resolve();
            };
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        });
    }
    return ytApiReadyPromise;
};

// autoplay 為 false 時只先把播放器建好、影片載入但不播放（唱片行預先暖機用），
// 之後由 playNow 在使用者點擊的當下開始播放 —— iPhone Safari 只允許在點擊當下開始出聲。
export const useYouTubePlayer = (videoId, { autoplay = true } = {}) => {
    const [player, setPlayer] = useState(null);
    const [playerState, setPlayerState] = useState(-1);
    const [playerError, setPlayerError] = useState(null);
    const playerRef = useRef(null);
    const videoIdRef = useRef(videoId);
    videoIdRef.current = videoId;
    const autoplayRef = useRef(autoplay);
    const loadedIdRef = useRef(null); // 播放器目前載入的影片，避免同一支被重複載入而從頭播

    // 同步 autoplay 給下面的非同步建立流程讀（放在播放器生命週期的 effect 前面，先執行）
    useEffect(() => { autoplayRef.current = autoplay; }, [autoplay]);

    // 預先載入 YouTube IFrame API script（只執行一次，跨所有 hook 實例共用）
    useEffect(() => {
        loadYouTubeApi();
    }, []);

    // 處理播放器生命週期：videoId 有值時建立或更新，無值時銷毀
    useEffect(() => {
        let cancelled = false;

        // videoId 為 null → 銷毀播放器
        if (!videoId) {
            if (playerRef.current) {
                try { playerRef.current.destroy(); } catch (_) {}
                playerRef.current = null;
                loadedIdRef.current = null;
                setPlayer(null);
                setPlayerState(-1);
                setPlayerError(null);
            }
            return;
        }

        loadYouTubeApi().then(() => {
            // 這次 effect 已被取代（videoId 又變了，或元件已卸載）→ 放棄建立，避免操作已消失的掛載點
            if (cancelled) return;
            if (!document.getElementById('yt-player-mount')) return;

            // 播放器已存在 → 直接切換影片，避免重建造成卡頓
            if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
                // 已經由 playNow 載入這支（或本來就是這支）就不再載一次
                if (loadedIdRef.current === videoIdRef.current) return;
                try {
                    setPlayerError(null);
                    if (autoplayRef.current) playerRef.current.loadVideoById(videoIdRef.current);
                    else playerRef.current.cueVideoById(videoIdRef.current);
                    loadedIdRef.current = videoIdRef.current;
                } catch { /* 播放器切換中，下次換影片再載 */ }
                return;
            }

            if (playerRef.current) {
                try { playerRef.current.destroy(); } catch (_) {}
            }

            const newPlayer = new window.YT.Player('yt-player-mount', {
                height: '100%',
                width: '100%',
                videoId: videoIdRef.current,
                playerVars: {
                    'playsinline': 1,  // iOS 不強制全螢幕
                    'controls': 0,     // 隱藏 YT 原生控制列
                    'rel': 0,          // 不顯示相關影片
                    'modestbranding': 1,
                    'autoplay': autoplayRef.current ? 1 : 0, // 進入沉浸模式自動播放；預先暖機時不播
                    'mute': 0,
                },
                events: {
                    'onReady': () => {},
                    'onStateChange': (event) => {
                        setPlayerState(event.data);
                    },
                    'onError': (e) => {
                        // 101 / 150 = 版權方禁止嵌入；2 = 無效 ID；5 = HTML5 不支援
                        setPlayerError(e.data);
                    },
                },
            });

            playerRef.current = newPlayer;
            loadedIdRef.current = videoIdRef.current;
            setPlayer(newPlayer);
        });

        return () => { cancelled = true; };
    }, [videoId]);

    // 預先暖機的播放器轉成要播放（例如從選單開沉浸模式）時，影片已經載好，補一個播放
    useEffect(() => {
        const p = playerRef.current;
        if (!autoplay || !p || typeof p.getPlayerState !== 'function') return;
        if (loadedIdRef.current !== videoIdRef.current) return;
        try {
            const state = p.getPlayerState();
            if (state !== 1 && state !== 3) p.playVideo();
        } catch { /* 播放器尚未就緒 */ }
    }, [autoplay]);

    // 在使用者點擊的事件裡直接呼叫：播放器已就緒就立刻換成這支並播放，回傳是否成功
    const playNow = useCallback((id) => {
        const p = playerRef.current;
        if (!id || !p || typeof p.loadVideoById !== 'function') return false;
        try {
            setPlayerError(null);
            p.loadVideoById(id);
            loadedIdRef.current = id;
            return true;
        } catch {
            return false;
        }
    }, []);

    // 元件徹底卸載時銷毀播放器，避免殘留 iframe 與監聽器
    useEffect(() => {
        return () => {
            if (playerRef.current) {
                try { playerRef.current.destroy(); } catch (_) {}
                playerRef.current = null;
            }
        };
    }, []);

    return { player, playerState, playerError, playNow };
};
