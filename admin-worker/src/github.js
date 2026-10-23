// 代為呼叫 GitHub API：金鑰只存在 Worker 的 GITHUB_TOKEN，前端拿不到
// 只開放後台用得到的三件事（讀資料、寫資料、看流量），不做通用代理
// 資料放在 DATA_DIR 底下：每年一個 2026.json、2027.json…，更新日誌是 changelog.json

const githubFetch = (env, path, init = {}) => fetch('https://api.github.com/repos/' + env.GITHUB_OWNER + '/' + env.GITHUB_REPO + path, {
    ...init,
    headers: {
        Authorization: 'Bearer ' + env.GITHUB_TOKEN,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'afroisgood-admin-worker',
        ...(init.body ? { 'Content-Type': 'application/json' } : {}),
    },
});

const fail = async (res, action) => {
    const err = new Error(
        res.status === 401 ? 'Worker 的 GitHub 金鑰無效或已過期' :
        res.status === 403 ? 'Worker 的 GitHub 金鑰權限不足' :
        res.status === 409 ? '資料已在別處更新，請重新整理後再存一次' :
        `${action}失敗（GitHub ${res.status}）`
    );
    err.status = res.status === 409 ? 409 : 502;
    throw err;
};

// 只認得年份檔與更新日誌，其他名稱一律拒絕，Worker 不能被拿去改 repo 裡的其他檔案
const DATA_FILE = /^(\d{4}|changelog)$/;
const dataPath = (env, file) => env.DATA_DIR + '/' + file + '.json';

const readFile = async (env, file) => {
    const res = await githubFetch(env, '/contents/' + dataPath(env, file));
    if (!res.ok) await fail(res, '讀取資料');
    const { sha, content } = await res.json();
    return { sha, content };
};

// 一次讀回所有年份與更新日誌：{ files: { "2026": { sha, content }, "changelog": { sha, content } } }
export const readData = async (env) => {
    const res = await githubFetch(env, '/contents/' + env.DATA_DIR);
    if (!res.ok) await fail(res, '讀取資料');
    const names = (await res.json())
        .filter(item => item.type === 'file' && item.name.endsWith('.json'))
        .map(item => item.name.slice(0, -'.json'.length))
        .filter(name => DATA_FILE.test(name));
    const files = await Promise.all(names.map(name => readFile(env, name)));
    return { files: Object.fromEntries(names.map((name, i) => [name, files[i]])) };
};

// sha 為 null 代表新的一年，檔案還不存在，直接建立
export const writeData = async (env, { file, content, sha, message }) => {
    if (typeof file !== 'string' || !DATA_FILE.test(file) || typeof content !== 'string' ||
        (sha !== null && typeof sha !== 'string')) {
        const err = new Error('缺少資料內容');
        err.status = 400;
        throw err;
    }
    const res = await githubFetch(env, '/contents/' + dataPath(env, file), {
        method: 'PUT',
        body: JSON.stringify({ message: message || 'Update jazz data', content, ...(sha ? { sha } : {}) }),
    });
    if (!res.ok) await fail(res, '儲存');
    const json = await res.json();
    return { sha: json.content.sha };
};

export const readTraffic = async (env) => {
    const res = await githubFetch(env, '/traffic/views');
    if (!res.ok) await fail(res, '讀取流量');
    return res.json();
};
