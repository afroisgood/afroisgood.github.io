// src/components/PageSheet.jsx
// 一張日曆頁：情境底色＋封面氛圍光＋大日期水印＋當日文章。
// 換日期時新舊兩張同時存在，疊在一起做撕頁動畫，所以每張頁都要自帶不透明底色。
import { useEffect, useRef } from 'react';
import { DailyArticle } from './DailyArticle';
import { ArticleSkeleton } from './ArticleSkeleton';

const noop = () => {};

// 氛圍光：把封面縮成 24×24 畫進 canvas，再用 CSS 拉滿整頁，瀏覽器放大時的平滑插值本身就是柔焦效果。
// 取代原本對整張原圖做 blur(60px)＋放大 1.4 倍，捲動與撕頁時不用再重算大面積模糊。
const AMBIENT_SIZE = 24;

const AmbientBackdrop = ({ src }) => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            const ctx = canvasRef.current?.getContext('2d');
            if (!ctx) return;
            // 與 background-size: cover 一樣取中央正方形
            const side = Math.min(img.naturalWidth, img.naturalHeight);
            ctx.clearRect(0, 0, AMBIENT_SIZE, AMBIENT_SIZE);
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(
                img,
                (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side,
                0, 0, AMBIENT_SIZE, AMBIENT_SIZE,
            );
        };
        img.src = src;
        return () => { img.onload = null; };
    }, [src]);

    return (
        <canvas
            ref={canvasRef}
            width={AMBIENT_SIZE}
            height={AMBIENT_SIZE}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none album-ambient-bg"
            style={{ filter: 'saturate(1.8) brightness(0.6)', zIndex: 0 }}
        />
    );
};

export const PageSheet = ({
    date,
    data,
    ready,
    youtubeId,
    setIsImmersive = noop,
    revealContent = false,
    className = '',
    style,
    inert = false,
}) => (
    <div className={`page-sheet px-5 pt-7 pb-24 lg:px-14 lg:pt-9 ${className}`} style={style} inert={inert} aria-hidden={inert || undefined}>
        {data?.imageUrl && <AmbientBackdrop src={data.imageUrl} />}

        <div className="relative" style={{ zIndex: 1 }}>
            <div className="absolute top-0 right-0 lg:right-16 -z-10 select-none pointer-events-none" style={{ opacity: 0.03 }}>
                <span className="font-playfair leading-none text-stone-900" style={{ fontSize: 'clamp(10rem, 20vw, 22rem)' }}>
                    {String(date.getDate()).padStart(2, '0')}
                </span>
            </div>

            {ready ? (
                <DailyArticle
                    className={revealContent ? 'article-reveal' : ''}
                    currentData={data}
                    selectedDate={date}
                    youtubeId={youtubeId}
                    setIsImmersive={setIsImmersive}
                />
            ) : (
                <ArticleSkeleton />
            )}
        </div>
    </div>
);
