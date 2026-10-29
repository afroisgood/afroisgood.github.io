// 唱片中間標籤用的像素封面：部署時 scripts/build-cover-pixels.mjs 把每天的封面縮成 60×60，
// 存在 /cover-px/<日期>.json（跟網站同網域，外站封面讀不到像素的限制就不存在）。
// 開發模式或某張封面抓不到時沒有這個檔，標籤就用預設的金色。
import { useEffect, useState } from 'react';

// 唱片和標籤用比場景細 3 倍的格子畫（一個場景格 = 3×3 個唱片格），封面才看得清楚
export const DETAIL = 3;
export const LABEL_R = 10; // 標籤半徑（場景格）
export const COVER_SIZE = LABEL_R * 2 * DETAIL; // 60：標籤直徑上的唱片格數，一格對一個封面像素
// 畫進畫布時每個唱片格放大成幾個像素，放進 SVG 再縮放時邊緣才不會糊
export const CANVAS_CELL = 4;

const cache = new Map(); // date → 顏色陣列，或 null（沒有像素封面）

const parse = (json) => {
    if (json?.size !== COVER_SIZE || typeof json.px !== 'string' || json.px.length !== COVER_SIZE * COVER_SIZE * 6) return null;
    return Array.from({ length: COVER_SIZE * COVER_SIZE }, (_, i) => '#' + json.px.slice(i * 6, i * 6 + 6));
};

/** 這一天封面的 COVER_SIZE×COVER_SIZE 顏色（由左上往右、往下），還沒載到或沒有時是 null */
export const useCoverPixels = (date) => {
    const [loaded, setLoaded] = useState(() => ({ date, px: cache.get(date) ?? null }));

    useEffect(() => {
        if (!date || cache.has(date)) return;
        let cancelled = false;
        fetch(`/cover-px/${date}.json`)
            .then(res => (res.ok ? res.json() : null))
            .catch(() => null)
            .then(json => {
                const px = parse(json);
                cache.set(date, px);
                if (!cancelled) setLoaded({ date, px });
            });
        return () => { cancelled = true; };
    }, [date]);

    return loaded.date === date ? loaded.px : cache.get(date) ?? null;
};

// 把一列一列的顏色合併成同色的水平線段，SVG 元素數少很多
export const toRuns = (rows) => {
    const runs = [];
    rows.forEach((row, y) => {
        let x = 0;
        while (x < row.length) {
            const c = row[x];
            if (!c) { x++; continue; }
            let end = x + 1;
            while (end < row.length && row[end] === c) end++;
            runs.push({ x, y, w: end - x, fill: c });
            x = end;
        }
    });
    return runs;
};

/** 畫一張 w×h 唱片格的圖（colorAt 回傳 null 就留透明），回傳可以放進 SVG <image> 的網址 */
export const paintCells = (w, h, colorAt) => {
    const canvas = document.createElement('canvas');
    canvas.width = w * CANVAS_CELL;
    canvas.height = h * CANVAS_CELL;
    const ctx = canvas.getContext('2d');
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const c = colorAt(x, y);
            if (!c) continue;
            ctx.fillStyle = c;
            ctx.fillRect(x * CANVAS_CELL, y * CANVAS_CELL, CANVAS_CELL, CANVAS_CELL);
        }
    }
    return canvas.toDataURL();
};

/** 俯視的圓形標籤：封面裁成圓形 */
export const labelImage = (px) => paintCells(COVER_SIZE, COVER_SIZE, (i, j) => {
    const r = COVER_SIZE / 2;
    const dx = i + 0.5 - r, dy = j + 0.5 - r;
    return dx * dx + dy * dy <= r * r ? px[j * COVER_SIZE + i] : null;
});
