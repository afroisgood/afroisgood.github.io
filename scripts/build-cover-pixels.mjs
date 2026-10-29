// scripts/build-cover-pixels.mjs
// vite build 之後執行：把每一天的封面縮成 60×60 的像素顏色，寫到 dist/cover-px/2026-10-23.json。
// 唱片行唱盤中間的標籤用它畫成像素風封面。封面放在 Discogs、Apple 等外站，瀏覽器不讓網頁讀外站圖片的像素，
// 所以在部署時先算好、跟網站放在同一個網域。
// 只處理已經公開的日期；抓過的封面存在 .cache/cover-px（GitHub Actions 會快取這個資料夾），之後只抓新的。
// 任何一張抓不到或解不開都直接略過（標籤改用預設的金色），不會讓部署失敗；失敗原因依網站彙整印在部署紀錄裡。

import { readFileSync, readdirSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const DIST = 'dist';
const DATA_DIR = join(DIST, 'data');
const OUT_DIR = join(DIST, 'cover-px');
const CACHE_DIR = join('.cache', 'cover-px');
const SIZE = 60; // 與 src/explore/coverPixels.js 的 COVER_SIZE 一致
const CONCURRENCY = 4;
const TIMEOUT_MS = 15000;
// Wikimedia 等網站要求請求帶上可辨識的身分與聯絡方式，否則會拒絕
const USER_AGENT = 'JAZZ365-build/1.0 (https://jazzcalender365.com)';

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

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 下載封面（被限速或伺服器出錯時等一下再試一次），取中間的正方形縮成 SIZE×SIZE，輸出 rrggbb 連在一起的字串。
// 只要 JPEG，但有些網站（例如 Apple）仍可能回 WebP／AVIF，sharp 都解得開。
const fetchPixels = async (url) => {
    let res;
    for (let attempt = 0; attempt < 2; attempt++) {
        res = await fetch(url, {
            headers: { Accept: 'image/jpeg', 'User-Agent': USER_AGENT },
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (res.status !== 429 && res.status < 500) break;
        await sleep(2000);
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { data, info } = await sharp(Buffer.from(await res.arrayBuffer()))
        .flatten({ background: '#000000' })
        .resize(SIZE, SIZE, { fit: 'cover' })
        .raw()
        .toBuffer({ resolveWithObject: true });
    if (info.width !== SIZE || info.height !== SIZE || info.channels !== 3) throw new Error(`尺寸 ${info.width}×${info.height}×${info.channels}`);
    return data.toString('hex');
};

const entries = readdirSync(DATA_DIR)
    .filter(name => /^\d{4}\.json$/.test(name))
    .flatMap(name => JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8')))
    .filter(entry => /^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? '') && isVisible(entry.date) && coverUrl(entry));

mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(CACHE_DIR, { recursive: true });

let made = 0, fetched = 0;
const failures = new Map(); // 「網站：原因」→ 張數
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
            } catch (err) {
                const reason = `${new URL(url).host}：${err.name === 'TimeoutError' ? '逾時' : err.message}`;
                failures.set(reason, (failures.get(reason) ?? 0) + 1);
                continue;
            }
        }
        writeFileSync(join(OUT_DIR, `${entry.date}.json`), JSON.stringify({ size: SIZE, px }));
        made++;
    }
};
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const failed = [...failures.values()].reduce((a, b) => a + b, 0);
console.log(`像素封面：${made} 張（新抓 ${fetched} 張，抓不到 ${failed} 張）`);
for (const [reason, count] of failures) console.log(`  抓不到 ${count} 張｜${reason}`);
