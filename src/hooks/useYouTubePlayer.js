// src/hooks/useYouTubePlayer.js
import { useState, useEffect, useRef } from 'react';

export const useYouTubePlayer = (videoId) => {
    const [player, setPlayer] = useState(null);
    const [playerState, setPlayerState] = useState(-1);
    const [isReady, setIsReady] = useState(false);
    const playerRef = useRef(null);

    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }

        if (!videoId || !document.getElementById('yt-player-mount')) {
            if (playerRef.current) {
                playerRef.current.destroy();
                playerRef.current = null;
                setPlayer(null);
                setPlayerState(-1);
            }
            return;
        }

        const createPlayer = () => {
            if (playerRef.current) {
                playerRef.current.destroy();
            }

            const newPlayer = new window.YT.Player('yt-player-mount', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: {
                    'playsinline': 1,
                    'controls': 0,
                    'rel': 0,
                    'modestbranding': 1,
                    'autoplay': 1,
                    'mute': 0 
                },
                events: {
                    'onReady': (event) => {
                        setIsReady(true);
                    },
                    'onStateChange': (event) => {
                        setPlayerState(event.data);
                    },
                    'onError': (e) => {
                        console.error("YouTube Error:", e);
                    }
                }
            });
            playerRef.current = newPlayer;
            setPlayer(newPlayer);
        };

        if (window.YT && window.YT.Player) {
            createPlayer();
        } else {
            window.onYouTubeIframeAPIReady = createPlayer;
        }

        return () => {
            if (playerRef.current) {
                // Cleanup
            }
        };
    }, [videoId]);

    return { player, playerState, isReady };
};