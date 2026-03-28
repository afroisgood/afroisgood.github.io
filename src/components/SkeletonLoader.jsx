// src/components/SkeletonLoader.jsx

const Bone = ({ className = '', style = {} }) => (
    <div className={`animate-pulse bg-stone-300/60 rounded-sm ${className}`} style={style} />
);

export const SkeletonLoader = () => (
    <div className="retro-desktop min-h-screen font-sans relative overflow-x-hidden">

        {/* Menu bar */}
        <div className="retro-menubar">
            <div className="flex items-center gap-4">
                <Bone className="w-20 h-2 bg-stone-700/50" />
                <Bone className="w-16 h-2 bg-stone-700/50" />
                <Bone className="w-24 h-2 bg-stone-700/50" />
            </div>
            <Bone className="w-32 h-2 bg-stone-700/50" />
        </div>

        <div
            className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-3 relative"
            style={{ padding: '4px 12px 12px', paddingTop: '28px' }}
        >
            {/* ── Sidebar skeleton（桌面才顯示）── */}
            <div className="hidden lg:block lg:col-span-3 retro-win" style={{ alignSelf: 'flex-start' }}>
                <div className="retro-titlebar" style={{ gap: 7 }}>
                    <span className="retro-ctrl">&#215;</span>
                    <span className="retro-ctrl">&#8722;</span>
                    <span className="retro-ctrl">&#9633;</span>
                    <Bone className="flex-1 h-2 bg-stone-600/50 ml-1" />
                </div>
                <div className="retro-body" style={{ padding: '16px 14px 20px' }}>
                    {/* 月份導覽 */}
                    <div className="flex justify-between items-center mb-3">
                        <Bone className="w-5 h-5 bg-stone-300/80" />
                        <Bone className="w-28 h-3" />
                        <Bone className="w-5 h-5 bg-stone-300/80" />
                    </div>
                    {/* 星期標題列 */}
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {Array.from({ length: 7 }).map((_, i) => (
                            <Bone key={i} className="h-2.5" style={{ animationDelay: `${i * 40}ms` }} />
                        ))}
                    </div>
                    {/* 日期格子（5 週） */}
                    {Array.from({ length: 5 }).map((_, row) => (
                        <div key={row} className="grid grid-cols-7 gap-1 mb-1">
                            {Array.from({ length: 7 }).map((_, col) => (
                                <Bone
                                    key={col}
                                    className="h-6"
                                    style={{ animationDelay: `${(row * 7 + col) * 25}ms` }}
                                />
                            ))}
                        </div>
                    ))}
                    {/* Random Explore 區塊 */}
                    <Bone className="w-full h-24 mt-4 bg-stone-300/50" style={{ animationDelay: '320ms' }} />
                    {/* 版本號 */}
                    <Bone className="w-20 h-2.5 mx-auto mt-4" style={{ animationDelay: '360ms' }} />
                </div>
            </div>

            {/* ── 主內容視窗 skeleton ── */}
            <div
                className="lg:col-span-9 relative retro-win"
                style={{ alignSelf: 'flex-start', minHeight: 600 }}
            >
                {/* 標題列（桌面） */}
                <div className="hidden lg:flex retro-titlebar" style={{ alignItems: 'center', gap: 7 }}>
                    <span className="retro-ctrl">&#215;</span>
                    <span className="retro-ctrl">&#8722;</span>
                    <span className="retro-ctrl">&#9633;</span>
                    <Bone className="flex-1 h-2 bg-stone-600/50 ml-1" />
                </div>

                <div
                    className="retro-body relative overflow-hidden"
                    style={{ padding: '36px 56px 40px', paddingBottom: '96px' }}
                >
                    {/* Header：日期 + 曲目 + 藝術家 */}
                    <div className="mb-10 lg:mb-16">
                        <div className="flex items-baseline gap-4 mb-4">
                            <Bone className="w-28 h-16 lg:h-24 bg-stone-400/50" style={{ animationDelay: '60ms' }} />
                            <Bone className="w-36 h-7 lg:h-9 bg-stone-300/60" style={{ animationDelay: '80ms' }} />
                        </div>
                        <Bone className="w-4/5 h-10 lg:h-14 bg-stone-400/50 mb-5" style={{ animationDelay: '100ms' }} />
                        <div className="flex flex-col lg:flex-row gap-2 lg:gap-6">
                            <Bone className="w-52 h-5 bg-stone-300/60" style={{ animationDelay: '120ms' }} />
                            <Bone className="w-44 h-5 bg-stone-200/70" style={{ animationDelay: '140ms' }} />
                        </div>
                    </div>

                    {/* 雙欄：封面 + 內文 */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">

                        {/* 左：專輯封面 */}
                        <div className="lg:col-span-5">
                            <Bone
                                className="aspect-square w-full bg-stone-400/40 retro-album-frame"
                                style={{ animationDelay: '160ms' }}
                            />
                            {/* VINYL LISTENING 按鈕 */}
                            <Bone className="w-full h-8 mt-2 bg-stone-300/40" style={{ animationDelay: '180ms' }} />
                        </div>

                        {/* 右：引言 + 內文 + 串流按鈕 */}
                        <div className="lg:col-span-7 flex flex-col pt-2 min-h-[420px]">
                            {/* 引言 */}
                            <div className="pl-8 mb-10 space-y-2.5">
                                <Bone className="h-5 bg-stone-300/60" style={{ animationDelay: '200ms' }} />
                                <Bone className="w-5/6 h-5 bg-stone-300/55" style={{ animationDelay: '220ms' }} />
                                <Bone className="w-3/5 h-5 bg-stone-300/50" style={{ animationDelay: '240ms' }} />
                            </div>
                            {/* 正文段落 */}
                            <div className="space-y-2 flex-1">
                                {Array.from({ length: 8 }).map((_, i) => (
                                    <Bone
                                        key={i}
                                        className="h-3.5 bg-stone-200/70"
                                        style={{
                                            width: i === 7 ? '55%' : i % 3 === 2 ? '88%' : '100%',
                                            animationDelay: `${260 + i * 40}ms`,
                                        }}
                                    />
                                ))}
                            </div>
                            {/* 串流按鈕 */}
                            <div
                                className="mt-10 pt-5 grid grid-cols-2 gap-2"
                                style={{ borderTop: '2px solid #c8b4a4' }}
                            >
                                {Array.from({ length: 4 }).map((_, i) => (
                                    <Bone
                                        key={i}
                                        className="h-10 bg-stone-300/50"
                                        style={{ animationDelay: `${580 + i * 60}ms` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
);
