import { useEffect, useRef, useState } from 'react';

// 把封面縮成 res×res 的小圖再放大顯示，變成像素風封面。
// 圖片不加 crossOrigin：畫進 canvas 後雖然不能再讀出像素，但顯示不受影響，外站封面也能用。
export const PixelCover = ({ src, res = 12, size, fallback = '#3a2808', className = '', style }) => {
    const canvasRef = useRef(null);
    const [drawnSrc, setDrawnSrc] = useState(null);

    useEffect(() => {
        if (!src) return;
        let cancelled = false;
        const img = new Image();
        img.decoding = 'async';
        img.onload = () => {
            const canvas = canvasRef.current;
            if (cancelled || !canvas) return;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.clearRect(0, 0, res, res);
            ctx.drawImage(img, 0, 0, res, res);
            setDrawnSrc(src);
        };
        img.src = src;
        return () => { cancelled = true; };
    }, [src, res]);

    return (
        <span className={className} style={{ display: 'block', width: size, height: size, background: fallback, ...style }}>
            <canvas
                ref={canvasRef}
                width={res}
                height={res}
                style={{ width: '100%', height: '100%', display: 'block', imageRendering: 'pixelated', opacity: drawnSrc === src ? 1 : 0 }}
            />
        </span>
    );
};
