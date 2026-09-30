// src/components/ArticleSkeleton.jsx
// data.json 尚未載入時的文章佔位，版面對齊 DailyArticle，內容到齊後直接替換

const LINE_WIDTHS = ['100%', '100%', '92%', '100%', '70%', '100%', '85%'];

export const ArticleSkeleton = () => (
    <div role="status" className="relative w-full max-w-5xl mx-auto">
        <span className="sr-only">載入中…</span>
        <div aria-hidden="true">
            <header className="mb-10 lg:mb-16">
                <div className="skeleton-block h-16 lg:h-24 w-40 lg:w-56 mb-4"></div>
                <div className="skeleton-block h-10 lg:h-14 w-3/4 mb-4"></div>
                <div className="skeleton-block h-5 w-1/2"></div>
            </header>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                <div className="lg:col-span-5 w-full max-w-sm mx-auto lg:max-w-none">
                    <div className="skeleton-block aspect-square w-full"></div>
                </div>
                <div className="lg:col-span-7 flex flex-col gap-4 pt-2">
                    {LINE_WIDTHS.map((width, i) => (
                        <div key={i} className={`skeleton-block h-3 ${i === 5 ? 'mt-4' : ''}`} style={{ width }}></div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);
