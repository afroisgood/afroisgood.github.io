import { recognizeCalendarPhoto } from './claudeVision.js';
import { searchYouTube, searchSpotify } from './streamingSearch.js';
import { verifyLogin, createSession, verifySession } from './auth.js';
import { readData, writeData, readTraffic } from './github.js';

const corsHeaders = (env, origin) => {
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
    const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || '';
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
    };
};

const json = (body, status, headers) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

// 帳號密碼登入：同一個 IP 每分鐘最多試 5 次（wrangler.toml 的 LOGIN_LIMITER），
// 成功後發一張 12 小時有效的登入憑證，之後所有端點都憑這張通行
const handleLogin = async (request, env, headers) => {
    if (env.LOGIN_LIMITER) {
        const { success } = await env.LOGIN_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' });
        if (!success) return json({ error: '嘗試次數太多，請一分鐘後再試' }, 429, headers);
    }
    const { username, password } = await request.json().catch(() => ({}));
    if (!(await verifyLogin(env, username, password))) return json({ error: '帳號或密碼錯誤' }, 401, headers);
    return json(await createSession(env), 200, headers);
};

const recognize = async (request, env) => {
    const { image, mimeType } = await request.json();
    if (!image || !mimeType) throw Object.assign(new Error('缺少圖片資料'), { status: 400 });

    // data URL 的話（"data:image/jpeg;base64,xxxx"）只取 base64 本體
    const base64 = image.includes(',') ? image.split(',')[1] : image;

    const recognized = await recognizeCalendarPhoto(env, { base64, mimeType });

    // Apple Music／iTunes 搜尋改由前端瀏覽器直接呼叫（見 AdminPanel.jsx）—
    // Cloudflare Worker 的對外 IP 是跟其他用戶共用的資料中心 IP，常被 Apple 判定為異常流量擋掉，
    // 瀏覽器端的一般使用者 IP 反而不會有這個問題，而且 iTunes Search API 本身就不需要金鑰、也支援 CORS。
    const [youtube, spotify] = await Promise.allSettled([
        searchYouTube(env, recognized),
        searchSpotify(env, recognized),
    ]);

    const warnings = [];
    const pick = (result, label) => {
        if (result.status === 'fulfilled') return result.value;
        warnings.push(`${label}：${result.reason?.message || '搜尋失敗'}`);
        return null;
    };

    return {
        ...recognized,
        youtube: pick(youtube, 'YouTube') || '',
        spotify: pick(spotify, 'Spotify') || '',
        warnings,
    };
};

// 以下端點都要先登入
const routes = {
    'POST /recognize': recognize,
    'GET /data': (request, env) => readData(env),
    'PUT /data': async (request, env) => writeData(env, await request.json()),
    'GET /traffic': (request, env) => readTraffic(env),
};

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const headers = corsHeaders(env, origin);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers });
        }

        const route = request.method + ' ' + new URL(request.url).pathname;

        try {
            if (route === 'POST /login') return await handleLogin(request, env, headers);
            if (!routes[route]) return json({ error: 'Not found' }, 404, headers);

            if (!(await verifySession(env, request.headers.get('Authorization')))) {
                return json({ error: '登入已逾時，請重新登入' }, 401, headers);
            }
            return json(await routes[route](request, env), 200, headers);
        } catch (err) {
            return json({ error: err.message || '發生錯誤' }, err.status || 500, headers);
        }
    },
};
