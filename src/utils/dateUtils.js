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

/** 第一年的資料從這一年開始（public/data/2026.json） */
export const FIRST_YEAR = 2026;

/**
 * 判斷給定月份是否已到最早邊界（第一年的 1 月）
 */
export const isAtMinMonth = (currentMonth) =>
    currentMonth.getFullYear() === FIRST_YEAR && currentMonth.getMonth() === 0;

/**
 * 前一年的同一天，"YYYY-MM-DD"；2/29 往前推會落到不存在的日期，查不到資料就不顯示
 */
export const lastYearDateString = (date) =>
    `${date.getFullYear() - 1}-${formatDateString(date).slice(5)}`;

/**
 * 判斷某個日期的內容是否可以對外顯示。
 * 規則：
 *   - 過去日期 → 直接顯示
 *   - 未來日期 → 隱藏
 *   - 今天     → 需等到臺灣時間（UTC+8）上午 07:00 後才顯示
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
