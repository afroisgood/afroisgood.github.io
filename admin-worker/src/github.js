// 代為呼叫 GitHub API：金鑰只存在 Worker 的 GITHUB_TOKEN，前端拿不到
// 只開放後台用得到的三件事（讀 data.json、寫 data.json、看流量），不做通用代理

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

export const readData = async (env) => {
    const res = await githubFetch(env, '/contents/' + env.DATA_PATH);
    if (!res.ok) await fail(res, '讀取資料');
    const { sha, content } = await res.json();
    return { sha, content };
};

export const writeData = async (env, { content, sha, message }) => {
    if (typeof content !== 'string' || typeof sha !== 'string') {
        const err = new Error('缺少資料內容');
        err.status = 400;
        throw err;
    }
    const res = await githubFetch(env, '/contents/' + env.DATA_PATH, {
        method: 'PUT',
        body: JSON.stringify({ message: message || 'Update jazz data', content, sha }),
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
