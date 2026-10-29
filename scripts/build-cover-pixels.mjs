// scripts/build-cover-pixels.mjs
// vite build 之後執行：把每一天的封面縮成 20×20 的像素顏色，寫到 dist/cover-px/2026-10-23.json。
// 唱片行唱盤中間的標籤用它畫成像素風封面。封面放在 Discogs、Apple 等外站，瀏覽器不讓網頁讀外站圖片的像素，
// 所以在部署時先算好、跟網站放在同一個網域。
// 只處理已經公開的日期；抓過的封面存在 .cache/cover-px（GitHub Actions 會快取這個資料夾），之後只抓新的。
// 任何一張抓不到或解不開都直接略過（標籤改用預設的金色），不會讓部署失敗。

import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import jpeg from 'jpeg-js';

const DIST = 'dist';
const DATA_DIR = join(DIST, 'data');
const OUT_DIR = join(DIST, 'cover-px');
const CACHE_DIR = join('.cache', 'cover-px');
const SIZE = 20;
const CONCURRENCY = 6;
const TIMEOUT_MS = 15000;

// 與 build-share-pages.mjs 同一套「已公開」規則（臺灣時間當天上午 7 點後）
const taipeiNow = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
}).formatToParts(new Date()).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
const todayStr = `${taipeiNow.year}-${taipeiNow.month}-${taipeiNow.day}`;
const isVisible = (date) => date < todayStr || (date === todayStr && Number(taipeiNow.hour) >= 7);

const coverUrl = (entry) => {
    if (entry.imageUrl) return entry.imageUrl;
    const match = entry.youtube?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match && match[2].length === 11 ? `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg` : null;
};

// 取中間的正方形，每一格取區域平均色，輸出 SIZE×SIZE 個 rrggbb 連在一起的字串
const toPixels = ({ width, height, data }) => {
    const side = Math.min(width, height);
    const x0 = Math.floor((width - side) / 2);
    const y0 = Math.floor((height - side) / 2);
    let hex = '';
    for (let gy = 0; gy < SIZE; gy++) {
        for (let gx = 0; gx < SIZE; gx++) {
            const sx0 = x0 + Math.floor((gx * side) / SIZE), sx1 = x0 + Math.floor(((gx + 1) * side) / SIZE);
            const sy0 = y0 + Math.floor((gy * side) / SIZE), sy1 = y0 + Math.floor(((gy + 1) * side) / SIZE);
            let r = 0, g = 0, b = 0, n = 0;
            for (let y = sy0; y < sy1; y++) {
                for (let x = sx0; x < sx1; x++) {
                    const i = (y * width + x) * 4;
                    r += data[i]; g += data[i + 1]; b += data[i + 2]; n++;
                }
            }
            hex += [r, g, b].map(v => Math.round(v / Math.max(1, n)).toString(16).padStart(2, '0')).join('');
        }
    }
    return hex;
};

const fetchPixels = async (url) => {
    const res = await fetch(url, {
        headers: { Accept: 'image/jpeg,image/*;q=0.8', 'User-Agent': 'jazzcalender365-build' },
        signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const image = jpeg.decode(Buffer.from(await res.arrayBuffer()), { useTArray: true, maxMemoryUsageInMB: 256 });
    return toPixels(image);
};

const entries = readdirSync(DATA_DIR)
    .filter(name => /^\d{4}\.json$/.test(name))
    .flatMap(name => JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8')))
    .filter(entry => /^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? '') && isVisible(entry.date) && coverUrl(entry));

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(CACHE_DIR, { recursive: true });

let made = 0, fetched = 0, failed = 0;
const queue = [...entries];
const worker = async () => {
    for (let entry = queue.shift(); entry; entry = queue.shift()) {
        const url = coverUrl(entry);
        const cacheFile = join(CACHE_DIR, createHash('sha1').update(SIZE + ' ' + url).digest('hex') + '.txt');
        let px = existsSync(cacheFile) ? readFileSync(cacheFile, 'utf8') : null;
        if (!px) {
            try {
                px = await fetchPixels(url);
                writeFileSync(cacheFile, px);
                fetched++;
            } catch {
                failed++;
                continue;
            }
        }
        writeFileSync(join(OUT_DIR, `${entry.date}.json`), JSON.stringify({ size: SIZE, px }));
        made++;
    }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`像素封面：${made} 張（新抓 ${fetched} 張，抓不到 ${failed} 張）`);
