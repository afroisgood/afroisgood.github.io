// src/hooks/useMonthNav.js
// 共用月份切換邏輯 — Sidebar（桌面）與 MobileNav（行動）共用

import { isAtMinMonth } from '../utils/dateUtils';

export const useMonthNav = (currentMonth, setCurrentMonth) => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const atMinMonth = isAtMinMonth(currentMonth);
    const handlePrevMonth = () => { if (!atMinMonth) setCurrentMonth(new Date(year, month - 1, 1)); };
    const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

    return { year, month, atMinMonth, handlePrevMonth, handleNextMonth };
};
