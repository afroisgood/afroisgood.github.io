// 用辨識出的 artist/song/album，分別到三個串流服務搜尋最相關的一筆結果。
// 三個搜尋彼此獨立，任何一個失敗都不影響其他兩個。

const buildQuery = (artist, songOrAlbum) => [artist, songOrAlbum].filter(Boolean).join(' ').trim();

export const searchYouTube = async (env, { artist, song, album }) => {
    const query = buildQuery(artist, song || album);
    if (!query || !env.YOUTUBE_API_KEY) return '';

    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.searchParams.set('part', 'snippet');
    url.searchParams.set('type', 'video');
    url.searchParams.set('maxResults', '1');
    url.searchParams.set('q', query);
    url.searchParams.set('key', env.YOUTUBE_API_KEY);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`YouTube 搜尋失敗（${res.status}）`);
    const data = await res.json();
    const videoId = data.items?.[0]?.id?.videoId;
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : '';
};

export const searchAppleMusic = async (_env, { artist, album }) => {
    const query = buildQuery(artist, album);
    if (!query) return { appleMusic: '', imageUrl: '' };

    const url = new URL('https://itunes.apple.com/search');
    url.searchParams.set('term', query);
    url.searchParams.set('entity', 'album');
    url.searchParams.set('limit', '1');

    const res = await fetch(url);
    if (!res.ok) throw new Error(`Apple Music 搜尋失敗（${res.status}）`);
    const data = await res.json();
    const result = data.results?.[0];
    if (!result) return { appleMusic: '', imageUrl: '' };

    // artworkUrl100 是 100x100 縮圖，換成較大尺寸當作專輯封面
    const imageUrl = result.artworkUrl100 ? result.artworkUrl100.replace('100x100', '600x600') : '';
    return { appleMusic: result.collectionViewUrl || '', imageUrl };
};

let cachedSpotifyToken = null; // { token, expiresAt } — 同一個 Worker 實例內重複使用，減少 token 請求次數

const getSpotifyToken = async (env) => {
    if (cachedSpotifyToken && cachedSpotifyToken.expiresAt > Date.now()) {
        return cachedSpotifyToken.token;
    }
    const basic = btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`);
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error(`Spotify 授權失敗（${res.status}）`);
    const data = await res.json();
    cachedSpotifyToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in - 60) * 1000 };
    return cachedSpotifyToken.token;
};

export const searchSpotify = async (env, { artist, album }) => {
    if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) return '';
    const query = album && artist ? `album:${album} artist:${artist}` : buildQuery(artist, album);
    if (!query) return '';

    const token = await getSpotifyToken(env);
    const url = new URL('https://api.spotify.com/v1/search');
    url.searchParams.set('q', query);
    url.searchParams.set('type', 'album');
    url.searchParams.set('limit', '1');

    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) throw new Error(`Spotify 搜尋失敗（${res.status}）`);
    const data = await res.json();
    return data.albums?.items?.[0]?.external_urls?.spotify || '';
};
