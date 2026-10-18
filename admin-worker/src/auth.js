// 後台帳號密碼登入：密碼雜湊驗證 + 簽章登入憑證
// Worker 與 scripts/hash-password.mjs 共用，只用 Web Crypto（Workers 與 Node 都有）

const encoder = new TextEncoder();

// Cloudflare Workers 的 PBKDF2 上限是 100000 次
const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_SECONDS = 12 * 60 * 60;

const toBase64 = (bytes) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const fromBase64 = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
const toBase64Url = (bytes) => toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromBase64Url = (str) => fromBase64(str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - str.length % 4) % 4));

// 長度不同也逐位元比完，避免用回應時間猜出內容
const timingSafeEqual = (a, b) => {
    let diff = a.length ^ b.length;
    for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
    return diff === 0;
};

const pbkdf2 = async (password, salt, iterations) => {
    const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, 256));
};

// 產生存進 ADMIN_PASSWORD_HASH 的字串：pbkdf2-sha256:次數:salt:hash（不用 $，免得 .dev.vars 把它當變數展開）
export const hashPassword = async (password) => {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await pbkdf2(password, salt, PBKDF2_ITERATIONS);
    return ['pbkdf2-sha256', PBKDF2_ITERATIONS, toBase64(salt), toBase64(hash)].join(':');
};

const verifyPassword = async (password, stored) => {
    const [scheme, iterations, salt, hash] = (stored || '').split(':');
    if (scheme !== 'pbkdf2-sha256' || !iterations || !salt || !hash) return false;
    const actual = await pbkdf2(password, fromBase64(salt), Number(iterations));
    return timingSafeEqual(actual, fromBase64(hash));
};

export const verifyLogin = async (env, username, password) => {
    if (typeof username !== 'string' || typeof password !== 'string') return false;
    const userOk = timingSafeEqual(encoder.encode(username), encoder.encode(env.ADMIN_USERNAME || ''));
    // 帳號錯也照樣算一次密碼，回應時間才不會透露帳號對不對
    const passOk = await verifyPassword(password, env.ADMIN_PASSWORD_HASH);
    return userOk && passOk && Boolean(env.ADMIN_USERNAME);
};

// 登入憑證用密碼雜湊當簽章金鑰：換密碼後舊憑證全部自動失效
const signingKey = (env) => crypto.subtle.importKey(
    'raw', encoder.encode('session-v1:' + env.ADMIN_PASSWORD_HASH), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']
);

export const createSession = async (env) => {
    const expiresAt = Date.now() + SESSION_TTL_SECONDS * 1000;
    const payload = toBase64Url(encoder.encode(JSON.stringify({ exp: expiresAt })));
    const signature = await crypto.subtle.sign('HMAC', await signingKey(env), encoder.encode(payload));
    return { token: payload + '.' + toBase64Url(signature), expiresAt };
};

export const verifySession = async (env, authHeader) => {
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const [payload, signature] = token.split('.');
    if (!payload || !signature || !env.ADMIN_PASSWORD_HASH) return false;
    try {
        const valid = await crypto.subtle.verify('HMAC', await signingKey(env), fromBase64Url(signature), encoder.encode(payload));
        if (!valid) return false;
        const { exp } = JSON.parse(new TextDecoder().decode(fromBase64Url(payload)));
        return typeof exp === 'number' && exp > Date.now();
    } catch {
        return false;
    }
};
