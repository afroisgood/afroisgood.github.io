// src/hooks/useYouTubePlayer.js
import { useState, useEffect, useRef } from 'react';

export const useYouTubePlayer = (videoId) => {
    const [player, setPlayer] = useState(null);
    const [playerState, setPlayerState] = useState(-1);
    const playerRef = useRef(null);
    const videoIdRef = useRef(videoId);
    videoIdRef.current = videoId;

    // 載入 YouTube IFrame API script（只執行一次）
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }, []);

    // 處理播放器生命週期：videoId 有值時建立或更新，無值時銷毀
    useEffect(() => {
        // videoId 為 null → 銷毀播放器
        if (!videoId) {
            if (playerRef.current) {
                try { playerRef.current.destroy(); } catch (_) {}
                playerRef.current = null;
                setPlayer(null);
                setPlayerState(-1);
            }
            return;
        }

        // 掛載點尚未出現在 DOM（immersive 尚未開啟）
        if (!document.getElementById('yt-player-mount')) return;

        // 播放器已存在 → 直接切換影片，避免重建造成卡頓
        if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
            try {
                playerRef.current.loadVideoById(videoId);
            } catch (_) {}
            return;
        }

        // 首次建立播放器
        const createPlayer = () => {
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
                    'autoplay': 1,     // 進入沉浸模式自動播放
                    'mute': 0,
                },
                events: {
                    'onReady': () => {},
                    'onStateChange': (event) => {
                        setPlayerState(event.data);
                    },
                    'onError': (e) => {
                        console.error("YouTube Player Error:", e.data);
                    },
                },
            });

            playerRef.current = newPlayer;
            setPlayer(newPlayer);
        };

        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            // API 尚未載入完成，等待回調
            const prevCallback = window.onYouTubeIframeAPIReady;
            window.onYouTubeIframeAPIReady = () => {
                if (prevCallback) prevCallback();
                createPlayer();
            };
        }
    }, [videoId]);

    return { player, playerState };
};
