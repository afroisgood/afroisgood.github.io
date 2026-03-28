// src/components/ShareCard.jsx
// 純 Canvas 繪製：避免 html2canvas 的 CORS 截圖限制
import { useRef, useState, useEffect } from 'react';

// 用 fetch 將圖片轉成 blob URL（同源），讓 canvas 可以安全繪製
const loadImageSafe = async (url) => {
    try {
        const res = await fetch(url, { mode: 'cors' });
        const blob = await res.blob();
        return URL.createObjectURL(blob);
    } catch {
        return null; // CORS 失敗時優雅降級，顯示佔位色塊
    }
};

const wrapTextToLines = (ctx, text, maxWidth, maxLines = 3) => {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const word of words) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) {
            lines.push(line);
            line = word;
            if (lines.length >= maxLines) break;
        } else {
            line = test;
        }
    }
    if (line && lines.length < maxLines) lines.push(line);
    return lines;
};

const drawCard = async ({ currentData, selectedDate, moodHex, moodAccent }) => {
    const W = 1080, H = 630;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const accent = moodAccent || 'rgb(180,83,9)';
    const day    = String(selectedDate.getDate()).padStart(2, '0');
    const month  = selectedDate.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();

    // ── 1. 深色桌面背景 ──
    ctx.fillStyle = '#0a0c18';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(60,70,160,0.2)';
    for (let x = 9; x < W; x += 18)
        for (let y = 9; y < H; y += 18) {
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fill();
        }

    // ── 2. 視窗外框（Retro gold border）──
    const pad = 24, bw = 3;
    const wx = pad, wy = pad, ww = W - pad * 2, wh = H - pad * 2;
    ctx.fillStyle = '#c8a048'; ctx.fillRect(wx, wy, ww, bw); ctx.fillRect(wx, wy, bw, wh);
    ctx.fillStyle = '#3a2808'; ctx.fillRect(wx, wy + wh - bw, ww, bw); ctx.fillRect(wx + ww - bw, wy, bw, wh);

    const ix = wx + bw, iy = wy + bw, iw = ww - bw * 2, ih = wh - bw * 2;

    // ── 3. 標題列 ──
    const tbH = 34;
    const tbGrad = ctx.createLinearGradient(ix, iy, ix, iy + tbH);
    tbGrad.addColorStop(0, '#10121e'); tbGrad.addColorStop(1, '#0a0c18');
    ctx.fillStyle = tbGrad;
    ctx.fillRect(ix, iy, iw, tbH);
    ctx.fillStyle = '#2a2848'; ctx.fillRect(ix, iy + tbH - 1, iw, 1);
    await document.fonts.ready;
    ctx.fillStyle = '#d0c8e8';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DAILY JAZZ ALMANAC', ix + iw / 2, iy + 22);

    const cy = iy + tbH, ch = ih - tbH;

    // ── 4. 專輯封面（左 43%）──
    const covW = Math.round(iw * 0.43);
    let blobUrl = null;
    if (currentData.imageUrl) blobUrl = await loadImageSafe(currentData.imageUrl);

    if (blobUrl) {
        const img = await new Promise((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = blobUrl;
        });
        // cover-fit：裁切置中
        const scale  = Math.max(covW / img.width, ch / img.height);
        const sw     = covW / scale, sh = ch / scale;
        const sx     = (img.width  - sw) / 2, sy = (img.height - sh) / 2;
        ctx.drawImage(img, sx, sy, sw, sh, ix, cy, covW, ch);
        URL.revokeObjectURL(blobUrl);
    } else {
        // 降級：填色塊 + 圓圈
        ctx.fillStyle = '#c8b4a0'; ctx.fillRect(ix, cy, covW, ch);
        ctx.strokeStyle = '#a09080'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(ix + covW / 2, cy + ch / 2, 60, 0, Math.PI * 2); ctx.stroke();
        ctx.beginPath(); ctx.arc(ix + covW / 2, cy + ch / 2, 16, 0, Math.PI * 2); ctx.stroke();
    }

    // ── 5. 右側資訊面板 ──
    const rx = ix + covW, rw = iw - covW;
    ctx.fillStyle = moodHex || '#f2ece3';
    ctx.fillRect(rx, cy, rw, ch);

    const tp = 28; // text padding inside right panel
    let ty = cy + 34;

    // 日期大字
    ctx.fillStyle = '#1a0c00';
    ctx.textAlign = 'left';
    ctx.font = 'bold 80px Georgia, serif';
    const dayW = ctx.measureText(day).width;
    ctx.fillText(day, rx + tp, ty + 64);

    // 月份斜體
    ctx.fillStyle = accent;
    ctx.font = 'italic 22px Georgia, serif';
    ctx.fillText(month, rx + tp + dayW + 10, ty + 66);
    ty += 92;

    // mood 色線
    ctx.fillStyle = accent; ctx.globalAlpha = 0.45;
    ctx.fillRect(rx + tp, ty, rw * 0.6, 2);
    ctx.globalAlpha = 1;
    ty += 16;

    // 曲名
    ctx.fillStyle = '#1a0c00';
    ctx.font = 'bold 18px "Courier New", monospace';
    const songLines = wrapTextToLines(ctx, currentData.song.toUpperCase(), rw - tp * 2);
    for (const line of songLines) { ctx.fillText(line, rx + tp, ty); ty += 24; }
    ty += 6;

    // 藝術家
    ctx.fillStyle = '#3a2010';
    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillText(currentData.artist.toUpperCase(), rx + tp, ty);
    ty += 18;

    // 專輯
    ctx.fillStyle = '#7a5840';
    ctx.font = 'italic 12px Georgia, serif';
    const albumText = `"${currentData.album}"`;
    const truncAlbum = ctx.measureText(albumText).width > rw - tp * 2
        ? albumText.slice(0, Math.floor((rw - tp * 2) / 8)) + '…"'
        : albumText;
    ctx.fillText(truncAlbum, rx + tp, ty);

    // 品牌（右下）
    const brandY = cy + ch - 12;
    ctx.fillStyle = 'rgba(58,40,8,0.2)';
    ctx.fillRect(rx + tp, brandY - 26, rw - tp * 2, 1);
    ctx.fillStyle = '#3a2010';
    ctx.font = 'bold 10px "Courier New", monospace';
    ctx.textAlign = 'right';
    ctx.fillText('日めくりジャズ365 | 2026', rx + rw - tp, brandY - 10);
    ctx.fillStyle = '#8a6848';
    ctx.font = '9px "Courier New", monospace';
    ctx.fillText('afroisgood.github.io', rx + rw - tp, brandY + 2);

    return canvas;
};

// ─────────────────────────────────────────
export const ShareCard = ({ currentData, selectedDate, moodHex, moodAccent, onClose }) => {
    const previewRef  = useRef(null);
    const canvasCache = useRef(null);
    const [status, setStatus]   = useState('generating'); // 'generating' | 'ready' | 'error'

    const dateKey = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;

    useEffect(() => {
        drawCard({ currentData, selectedDate, moodHex, moodAccent })
            .then(canvas => {
                canvasCache.current = canvas;
                if (previewRef.current) {
                    canvas.style.cssText = 'width:100%;height:auto;display:block;';
                    previewRef.current.innerHTML = '';
                    previewRef.current.appendChild(canvas);
                }
                setStatus('ready');
            })
            .catch(() => setStatus('error'));
    }, []);

    const handleDownload = () => {
        if (!canvasCache.current) return;
        const a = document.createElement('a');
        a.download = `daily-jazz-${dateKey}.png`;
        a.href = canvasCache.current.toDataURL('image/png');
        a.click();
    };

    const handleShare = () => {
        if (!canvasCache.current) return;
        canvasCache.current.toBlob(async (blob) => {
            const file = new File([blob], `daily-jazz-${dateKey}.png`, { type: 'image/png' });
            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({ files: [file], title: `${currentData.song} — ${currentData.artist}` });
            } else {
                handleDownload();
            }
        }, 'image/png');
    };

    return (
        <div
            className="fixed inset-0 z-[400] flex flex-col items-center justify-center p-4 overflow-y-auto"
            style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
            onClick={onClose}
        >
            <div className="flex flex-col items-center gap-4 w-full max-w-2xl py-8" onClick={e => e.stopPropagation()}>

                {/* 預覽區 */}
                <div
                    ref={previewRef}
                    className="w-full"
                    style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    {status === 'generating' && (
                        <p style={{ color: '#d0c8e8', fontFamily: '"Courier New", monospace', fontSize: 12, letterSpacing: '0.2em' }}>
                            GENERATING…
                        </p>
                    )}
                    {status === 'error' && (
                        <p style={{ color: '#f08080', fontFamily: '"Courier New", monospace', fontSize: 12 }}>
                            ERROR — PLEASE TRY AGAIN
                        </p>
                    )}
                </div>

                {/* 操作按鈕 */}
                <div className="flex gap-2 w-full">
                    <button onClick={handleDownload} disabled={status !== 'ready'} className="retro-btn flex-1" style={{ fontSize: 11 }}>
                        ↓ DOWNLOAD
                    </button>
                    <button onClick={handleShare} disabled={status !== 'ready'} className="retro-btn flex-1" style={{ fontSize: 11 }}>
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
