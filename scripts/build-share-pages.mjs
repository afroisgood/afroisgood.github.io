// scripts/build-share-pages.mjs
// vite build 之後執行：替每一天產生一張分享頁 dist/2026/10/23/index.html。
// 網站本身用 #2026-10-23 切換日期，但 LINE／Facebook 抓預覽時看不到 # 後面，也不執行 JS，
// 所以分享出去的每一天都要有一張真的 HTML，把當天的封面、標題寫進 og: 標籤，
// 人點進來再用 JS 跳回主站的那一天。
// 只產生已經公開的日期（臺灣時間當天上午 7 點後），還沒公開的推薦不會提早露出；
// 每天 07:05 的排程部署會把當天的分享頁補上（見 .github/workflows/deploy.yml）。

import { readFileSync, readdirSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const SITE = 'https://jazzcalender365.com';
const DIST = 'dist';
const DATA_DIR = join(DIST, 'data');

const escapeHtml = (s) => String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

// 與 src/utils/dateUtils.js 的 isDateVisible 同一套規則，但一律用臺灣時間判斷
const taipeiNow = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Taipei', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hour12: false,
}).formatToParts(new Date()).reduce((acc, p) => ({ ...acc, [p.type]: p.value }), {});
const todayStr = `${taipeiNow.year}-${taipeiNow.month}-${taipeiNow.day}`;
const isVisible = (date) => date < todayStr || (date === todayStr && Number(taipeiNow.hour) >= 7);

const youtubeThumb = (url) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match && match[2].length === 11 ? `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg` : null;
};

const sharePage = (entry) => {
    const [y, m, d] = entry.date.split('-');
    const dateText = `${Number(m)}月${Number(d)}日`;
    const title = `${dateText} | ${entry.album} - ${entry.artist}`;
    const desc = `${dateText}的爵士推薦：${entry.artist}《${entry.album}》`;
    const image = entry.imageUrl || youtubeThumb(entry.youtube) || `${SITE}/og-image.png`;
    const url = `${SITE}/${y}/${m}/${d}/`;
    const target = `/#${entry.date}`;
    const meta = (attr, key, value) => `<meta ${attr}="${key}" content="${escapeHtml(value)}" />`;

    return `<!doctype html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(title)}</title>
    ${meta('name', 'description', desc)}
    <link rel="canonical" href="${url}" />
    ${meta('property', 'og:type', 'article')}
    ${meta('property', 'og:url', url)}
    ${meta('property', 'og:title', title)}
    ${meta('property', 'og:description', desc)}
    ${meta('property', 'og:image', image)}
    ${meta('property', 'og:site_name', 'JAZZ 365')}
    ${meta('property', 'og:locale', 'zh_TW')}
    ${meta('name', 'twitter:card', 'summary_large_image')}
    ${meta('name', 'twitter:title', title)}
    ${meta('name', 'twitter:description', desc)}
    ${meta('name', 'twitter:image', image)}
    <script>location.replace(${JSON.stringify(target)});</script>
  </head>
  <body>
    <p><a href="${target}">${escapeHtml(title)}</a></p>
  </body>
</html>
`;
};

// 還沒產生分享頁的日期（例如當天 7 點前就有人點了明天的連結）也不要停在 404，直接帶回主站那一天
const notFoundPage = `<!doctype html>
<html lang="zh-TW">
  <head>
    <meta charset="UTF-8" />
    <title>JAZZ 365 | Daily Jazz Almanac</title>
    <script>
      var m = location.pathname.match(/^\\/(\\d{4})\\/(\\d{2})\\/(\\d{2})\\/?$/);
      location.replace(m ? '/#' + m[1] + '-' + m[2] + '-' + m[3] : '/');
    </script>
  </head>
  <body><p><a href="/">JAZZ 365</a></p></body>
</html>
`;

const entries = readdirSync(DATA_DIR)
    .filter(name => /^\d{4}\.json$/.test(name))
    .flatMap(name => JSON.parse(readFileSync(join(DATA_DIR, name), 'utf8')))
    .filter(entry => /^\d{4}-\d{2}-\d{2}$/.test(entry.date ?? '') && entry.album && entry.artist && isVisible(entry.date));

for (const entry of entries) {
    const dir = join(DIST, ...entry.date.split('-'));
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'), sharePage(entry));
}
writeFileSync(join(DIST, '404.html'), notFoundPage);

console.log(`分享頁：產生 ${entries.length} 天（截至臺灣時間 ${todayStr}）`);
