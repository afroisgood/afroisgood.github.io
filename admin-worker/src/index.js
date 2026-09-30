import { recognizeCalendarPhoto } from './claudeVision.js';
import { searchYouTube, searchSpotify } from './streamingSearch.js';

const corsHeaders = (env, origin) => {
    const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());
    const allowOrigin = allowed.includes(origin) ? origin : allowed[0] || '';
    return {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        Vary: 'Origin',
    };
};

const json = (body, status, headers) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } });

// 用呼叫端帶來的 GitHub token 反查 /user，確認是站主本人才放行，
// 避免這支會花錢呼叫 Claude/串流 API 的端點被陌生人濫用。
const verifyIsOwner = async (env, authHeader) => {
    if (!authHeader) return false;
    const res = await fetch('https://api.github.com/user', {
        headers: { Authorization: authHeader, 'User-Agent': 'afroisgood-admin-worker' },
    });
    if (!res.ok) return false;
    const user = await res.json();
    return user.login === env.GITHUB_OWNER;
};

export default {
    async fetch(request, env) {
        const origin = request.headers.get('Origin') || '';
        const headers = corsHeaders(env, origin);

        if (request.method === 'OPTIONS') {
            return new Response(null, { status: 204, headers });
        }

        const url = new URL(request.url);
        if (url.pathname !== '/recognize' || request.method !== 'POST') {
            return json({ error: 'Not found' }, 404, headers);
        }

        try {
            const isOwner = await verifyIsOwner(env, request.headers.get('Authorization'));
            if (!isOwner) return json({ error: '未授權' }, 401, headers);

            const { image, mimeType } = await request.json();
            if (!image || !mimeType) return json({ error: '缺少圖片資料' }, 400, headers);

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

            const youtubeUrl = pick(youtube, 'YouTube') || '';
            const spotifyUrl = pick(spotify, 'Spotify') || '';

            return json({
                ...recognized,
                youtube: youtubeUrl,
                spotify: spotifyUrl,
                warnings,
            }, 200, headers);
        } catch (err) {
            return json({ error: err.message || '辨識失敗' }, 500, headers);
        }
    },
};
