// scripts/generate-feed.mjs
// 從 public/data.json 生成 RSS 2.0 feed，供 Buttondown 等服務偵測更新並自動寄信
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataPath  = resolve(__dirname, '../public/data.json');
const outPath   = resolve(__dirname, '../public/feed.xml');

const SITE_URL  = 'https://afroisgood.github.io';
const SITE_TITLE = '日めくりジャズ365 | 2026年版';
const SITE_DESC  = '每天一張爵士唱片推薦，365 天不間斷。Daily Jazz Almanac 2026。';

const esc = (s) => (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const data    = JSON.parse(readFileSync(dataPath, 'utf-8'));
const entries = (Array.isArray(data) ? data : (data.entries || []))
    .filter(e => e.date)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

const items = entries.map(e => {
    const [y, m, d] = e.date.split('-').map(Number);
    const pubDate = new Date(Date.UTC(y, m - 1, d, 9, 0, 0)).toUTCString();
    const title   = `${m}月${d}日 ｜ ${e.song || ''} — ${e.artist || ''}`;
    const link    = `${SITE_URL}/#${e.date}`;
    const thumb   = e.imageUrl
        ? `<img src="${esc(e.imageUrl)}" alt="${esc(e.album)}" style="max-width:300px"/><br/>`
        : '';
    const body    = e.content
        ? esc(e.content.slice(0, 300)) + (e.content.length > 300 ? '…' : '')
        : esc(`${e.artist} — ${e.album}`);

    return `
    <item>
      <title>${esc(title)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${thumb}${body}<br/><a href="${link}">▶ 閱讀全文</a>]]></description>
    </item>`;
}).join('');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE_TITLE)}</title>
    <link>${SITE_URL}</link>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>${esc(SITE_DESC)}</description>
    <language>zh-TW</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <image>
      <url>${SITE_URL}/og-image.png</url>
      <title>${esc(SITE_TITLE)}</title>
      <link>${SITE_URL}</link>
    </image>
${items}
  </channel>
</rss>`;

writeFileSync(outPath, xml, 'utf-8');
console.log(`✓ feed.xml 已生成，共 ${entries.length} 筆`);
