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
