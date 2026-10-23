// src/utils/searchEntries.js
// 前台搜尋與後台推薦列表共用：日期、樂手、專輯任一欄包含關鍵字就算符合（不分大小寫）

export const matchesQuery = (entry, query) => {
    const q = query.trim().toLowerCase();
    return [entry.date, entry.artist, entry.album].some(v => v?.toLowerCase().includes(q));
};
