// src/utils/dateUtils.js
// 共用日期工具函數

/**
 * 將 Date 物件格式化為 "YYYY-MM-DD" 字串
 */
export const formatDateString = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

/**
 * 判斷給定日期是否為今天
 */
export const isToday = (date) => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth()    === today.getMonth()    &&
           date.getDate()     === today.getDate();
};

/**
 * 判斷給定月份是否已到最早邊界（2026年1月）
 */
export const isAtMinMonth = (currentMonth) =>
    currentMonth.getFullYear() === 2026 && currentMonth.getMonth() === 0;

/**
 * 判斷某個日期的內容是否可以對外顯示。
 * 規則：
 *   - 過去日期 → 直接顯示
 *   - 未來日期 → 隱藏
 *   - 今天     → 需等到臺灣時間（UTC+8）上午 10:00 後才顯示
 *
 * @param {string} dateStr - "YYYY-MM-DD" 格式
 * @returns {boolean}
 */
export const isDateVisible = (dateStr) => {
    const todayStr = formatDateString(new Date());
    if (dateStr < todayStr) return true;   // 過去：永遠顯示
    if (dateStr > todayStr) return false;  // 未來：永遠隱藏

    // 今天：判斷臺灣時間是否已過上午 7 點（用 Intl API 取得正確時區小時）
    const hour = parseInt(
        new Intl.DateTimeFormat('en-US', {
            timeZone: 'Asia/Taipei',
            hour: '2-digit',
            hour12: false,
        }).format(new Date()),
        10
    );
    return hour >= 7;
};
