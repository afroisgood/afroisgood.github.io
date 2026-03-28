// src/components/ShareCard.jsx
import { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

export const ShareCard = ({ currentData, selectedDate, moodHex, moodAccent, onClose }) => {
    const cardRef = useRef(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const monthEn = selectedDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
    const accent = moodAccent || 'rgb(180,83,9)';

    const capture = async () => {
        setIsGenerating(true);
        try {
            return await html2canvas(cardRef.current, {
                useCORS: true,
                scale: 2,
                backgroundColor: null,
                logging: false,
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownload = async () => {
        const canvas = await capture();
        const a = document.createElement('a');
        a.download = `daily-jazz-${dateKey}.png`;
        a.href = canvas.toDataURL('image/png');
        a.click();
    };

    const handleShare = async () => {
        const canvas = await capture();
        canvas.toBlob(async (blob) => {
            const file = new File([blob], `daily-jazz-${dateKey}.png`, { type: 'image/png' });
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: `${currentData.song} — ${currentData.artist}` });
            } else {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `daily-jazz-${dateKey}.png`;
                a.click();
                URL.revokeObjectURL(url);
            }
        }, 'image/png');
    };

    return (
        <div
            className="fixed inset-0 z-[400] flex flex-col items-center justify-center p-4 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div className="flex flex-col items-center gap-4 w-full max-w-lg py-8" onClick={e => e.stopPropagation()}>

                {/* ── Card preview（此 div 將被 html2canvas 截圖）── */}
                <div
                    ref={cardRef}
                    style={{
                        width: '100%',
                        backgroundColor: '#0a0c18',
                        backgroundImage: 'radial-gradient(circle, rgba(60,70,160,0.22) 1px, transparent 1px)',
                        backgroundSize: '18px 18px',
                        padding: 20,
                    }}
                >
                    <div style={{
                        display: 'flex',
                        borderStyle: 'solid', borderWidth: 3,
                        borderTopColor: '#c8a048', borderLeftColor: '#c8a048',
                        borderRightColor: '#3a2808', borderBottomColor: '#3a2808',
                        boxShadow: '2px 2px 0 #1a0c00',
                        overflow: 'hidden',
                    }}>
                        {/* 左側：專輯封面 */}
                        <div style={{ width: '42%', flexShrink: 0, minHeight: 210, background: '#c8b4a0', position: 'relative' }}>
                            {currentData.imageUrl && (
                                <img
                                    src={currentData.imageUrl}
                                    crossOrigin="anonymous"
                                    alt={currentData.album}
                                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                                />
                            )}
                        </div>

                        {/* 右側：資訊面板 */}
                        <div style={{ flex: 1, backgroundColor: moodHex || '#f2ece3', display: 'flex', flexDirection: 'column' }}>
                            {/* 標題列 */}
                            <div style={{
                                background: 'linear-gradient(to bottom, #10121e, #0a0c18)',
                                padding: '7px 12px',
                                color: '#d0c8e8',
                                fontFamily: '"Courier New", monospace',
                                fontSize: 10, letterSpacing: '0.16em',
                                textAlign: 'center',
                                borderBottom: '1px solid #2a2848',
                            }}>
                                DAILY JAZZ ALMANAC
                            </div>

                            {/* 內容 */}
                            <div style={{ padding: '14px 16px 12px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                <div>
                                    {/* 日期 */}
                                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                                        <span style={{ fontSize: 52, fontWeight: 900, fontFamily: 'Georgia, serif', color: '#1a0c00', lineHeight: 1 }}>
                                            {day}
                                        </span>
                                        <span style={{ fontSize: 17, fontStyle: 'italic', fontFamily: 'Georgia, serif', color: accent }}>
                                            {monthEn}
                                        </span>
                                    </div>
                                    {/* Mood 色線 */}
                                    <div style={{ height: 2, backgroundColor: accent, opacity: 0.45, marginBottom: 10 }} />
                                    {/* 曲名 */}
                                    <div style={{
                                        fontFamily: '"Courier New", monospace',
                                        fontSize: 13, fontWeight: 900,
                                        textTransform: 'uppercase', letterSpacing: '0.05em',
                                        color: '#1a0c00', lineHeight: 1.3, marginBottom: 6,
                                    }}>
                                        {currentData.song}
                                    </div>
                                    {/* 藝術家 */}
                                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: 11, fontWeight: 'bold', letterSpacing: '0.12em', color: '#3a2010', textTransform: 'uppercase', marginBottom: 3 }}>
                                        {currentData.artist}
                                    </div>
                                    {/* 專輯 */}
                                    <div style={{ fontFamily: 'Georgia, serif', fontSize: 11, fontStyle: 'italic', color: '#7a5840' }}>
                                        &ldquo;{currentData.album}&rdquo;
                                    </div>
                                </div>

                                {/* 品牌 */}
                                <div style={{ borderTop: '1px solid rgba(58,40,8,0.2)', paddingTop: 8, marginTop: 10, textAlign: 'right' }}>
                                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: 9, letterSpacing: '0.1em', color: '#3a2010', lineHeight: 1.9 }}>
                                        日めくりジャズ365 | 2026
                                    </div>
                                    <div style={{ fontFamily: '"Courier New", monospace', fontSize: 8, color: '#8a6848', letterSpacing: '0.08em' }}>
                                        afroisgood.github.io
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 w-full">
                    <button onClick={handleDownload} disabled={isGenerating} className="retro-btn flex-1" style={{ fontSize: 11 }}>
                        {isGenerating ? 'GENERATING...' : '↓ DOWNLOAD'}
                    </button>
                    <button onClick={handleShare} disabled={isGenerating} className="retro-btn flex-1" style={{ fontSize: 11 }}>
                        ↗ SHARE
                    </button>
                    <button onClick={onClose} className="retro-btn" style={{ fontSize: 11, flex: 'none', padding: '8px 14px', width: 'auto' }}>
                        ✕
                    </button>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 9, fontFamily: '"Courier New", monospace', letterSpacing: '0.18em' }}>
                    CLICK OUTSIDE TO CLOSE
                </p>
            </div>
        </div>
    );
};
