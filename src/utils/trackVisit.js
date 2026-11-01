// 開啟網站時回報一次瀏覽給 admin-worker，後台「流量」分頁的數字就是從這裡來的。
// 只在正式站回報；在這台裝置登入過後台的話（網站主人自己），就不算進去。
const ADMIN_WORKER_URL = import.meta.env.VITE_ADMIN_WORKER_URL || '';
export const SKIP_TRACKING_KEY = 'jazz365_skip_tracking';

export const trackVisit = () => {
    if (!import.meta.env.PROD || !ADMIN_WORKER_URL) return;
    if (window.location.hash === '#admin') return;
    try {
        if (localStorage.getItem(SKIP_TRACKING_KEY)) return;
    } catch {
        // 無痕模式等情況讀不到 localStorage，照常回報
    }
    // 不帶內容與自訂標頭，瀏覽器不必先送預檢請求；失敗就算了，不影響看網站
    fetch(ADMIN_WORKER_URL + '/hit', { method: 'POST', keepalive: true }).catch(() => {});
};
