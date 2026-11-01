// 網站流量：前台每次開啟網站會打一次 POST /hit，這裡記進 D1 資料庫（綁定名稱 TRAFFIC_DB）
// 以前是讀 GitHub 的 /traffic/views，但那是 github.com 上「程式碼 repo 頁面」的瀏覽數，
// 跟 jazzcalender365.com 的訪客無關，所以改成自己記
//
// 每一列是「某一天的某一位訪客」：visitor 是 IP + 瀏覽器資訊加上祕密值後的雜湊，不存原始 IP

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS daily_visits (
    day TEXT NOT NULL,
    visitor TEXT NOT NULL,
    views INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (day, visitor)
)`;

const RANGE_DAYS = 30;
const KEEP_DAYS = 400;

// 搜尋引擎、社群預覽、自動化測試之類的非真人瀏覽不算
const BOT_UA = /bot|crawl|spider|slurp|facebookexternalhit|embedly|preview|headless|lighthouse|pagespeed|curl|wget|python|axios|node-fetch/i;

// 一天的界線用臺灣時間
const taiwanDay = (time = Date.now()) => new Date(time + 8 * 60 * 60 * 1000).toISOString().slice(0, 10);
const DAY_MS = 24 * 60 * 60 * 1000;

const visitorId = async (env, request) => {
    const ip = request.headers.get('CF-Connecting-IP') || '';
    const ua = request.headers.get('User-Agent') || '';
    // 用密碼雜湊當祕密值，外人無法從雜湊反推 IP；換密碼後同一位訪客會被當成新訪客，影響很小
    const data = new TextEncoder().encode('visitor-v1:' + (env.ADMIN_PASSWORD_HASH || '') + ':' + ip + ':' + ua);
    const hash = new Uint8Array(await crypto.subtle.digest('SHA-256', data));
    return Array.from(hash.slice(0, 12), b => b.toString(16).padStart(2, '0')).join('');
};

const runWithTable = async (db, statement) => {
    try {
        return await statement.run();
    } catch (err) {
        if (!/no such table/i.test(err.message || '')) throw err;
        await db.prepare(TABLE_SQL).run();
        return statement.run();
    }
};

const isAllowedOrigin = (env, origin) => {
    if (!origin || /^http:\/\/localhost(:\d+)?$/.test(origin)) return false;
    return (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).includes(origin);
};

// 不需要登入；任何不該算的情況都安靜略過，不讓前台看到錯誤
export const recordHit = async (request, env, ctx) => {
    const db = env.TRAFFIC_DB;
    if (!db || !isAllowedOrigin(env, request.headers.get('Origin') || '')) return;
    if (BOT_UA.test(request.headers.get('User-Agent') || '')) return;
    if (env.HIT_LIMITER) {
        const { success } = await env.HIT_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
        if (!success) return;
    }

    const insert = db.prepare(
        'INSERT INTO daily_visits (day, visitor, views) VALUES (?1, ?2, 1) ' +
        'ON CONFLICT (day, visitor) DO UPDATE SET views = views + 1'
    ).bind(taiwanDay(), await visitorId(env, request));
    await runWithTable(db, insert);

    // 偶爾清掉太舊的紀錄，資料庫不會一直長大
    if (Math.random() < 0.01) {
        ctx.waitUntil(db.prepare('DELETE FROM daily_visits WHERE day < ?1').bind(taiwanDay(Date.now() - KEEP_DAYS * DAY_MS)).run());
    }
};

// 回傳近 30 天：{ days, count, uniques, today, views: [{ timestamp: 'YYYY-MM-DD', count, uniques }] }（由舊到新，沒人來的日子補 0）
export const readTraffic = async (env) => {
    const db = env.TRAFFIC_DB;
    if (!db) {
        throw Object.assign(new Error('尚未設定流量資料庫（TRAFFIC_DB），請在 admin-worker 資料夾執行 npm run deploy'), { status: 500 });
    }
    const since = taiwanDay(Date.now() - (RANGE_DAYS - 1) * DAY_MS);
    const daily = db.prepare(
        'SELECT day, SUM(views) AS count, COUNT(*) AS uniques FROM daily_visits WHERE day >= ?1 GROUP BY day'
    ).bind(since);
    const total = db.prepare(
        'SELECT COALESCE(SUM(views), 0) AS count, COUNT(DISTINCT visitor) AS uniques FROM daily_visits WHERE day >= ?1'
    ).bind(since);

    let rows, totals;
    try {
        [{ results: rows }, { results: [totals] }] = await db.batch([daily, total]);
    } catch (err) {
        // 還沒有人來過、資料表還沒建立
        if (!/no such table/i.test(err.message || '')) throw err;
        rows = [];
        totals = { count: 0, uniques: 0 };
    }

    const byDay = Object.fromEntries(rows.map(r => [r.day, r]));
    const views = Array.from({ length: RANGE_DAYS }, (_, i) => {
        const day = taiwanDay(Date.now() - (RANGE_DAYS - 1 - i) * DAY_MS);
        return { timestamp: day, count: byDay[day]?.count ?? 0, uniques: byDay[day]?.uniques ?? 0 };
    });

    return { days: RANGE_DAYS, count: totals.count, uniques: totals.uniques, today: views[views.length - 1], views };
};
