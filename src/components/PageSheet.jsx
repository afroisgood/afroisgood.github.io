// src/components/PageSheet.jsx
// 一張日曆頁：情境底色＋模糊封面氛圍光＋大日期水印＋當日文章。
// 換日期時新舊兩張同時存在，疊在一起做撕頁動畫，所以每張頁都要自帶不透明底色。
import { DailyArticle } from './DailyArticle';
import { ArticleSkeleton } from './ArticleSkeleton';

const noop = () => {};

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
        {data?.imageUrl && (
            <div
                aria-hidden="true"
                className="absolute inset-0 pointer-events-none album-ambient-bg"
                style={{
                    backgroundImage: `url(${data.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    filter: 'blur(60px) saturate(1.8) brightness(0.6)',
                    transform: 'scale(1.4)',
                    zIndex: 0,
                }}
            />
        )}

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
