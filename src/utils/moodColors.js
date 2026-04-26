// src/utils/moodColors.js
// 心情色票 — App.jsx 與 AdminPanel.jsx 共用，單一來源

export const MOOD_OPTIONS = [
    { value: '',        label: '— 預設米白',        color: '#f2f0e9' },
    { value: '#FECACA', label: '珊瑚粉  Swing',      color: '#FECACA' },
    { value: '#FED7AA', label: '暖橘色  Hard Bop',   color: '#FED7AA' },
    { value: '#FDE68A', label: '琥珀金  Bebop',      color: '#FDE68A' },
    { value: '#D1FAE5', label: '薄荷綠  Soul Jazz',  color: '#D1FAE5' },
    { value: '#BFDBFE', label: '天空藍  Cool Jazz',  color: '#BFDBFE' },
    { value: '#C7D2FE', label: '深夜藍  Modal',      color: '#C7D2FE' },
    { value: '#DDD6FE', label: '薰衣草  Fusion',     color: '#DDD6FE' },
    { value: '#FCE7F3', label: '玫瑰粉  Latin',      color: '#FCE7F3' },
    { value: '#E2E8F0', label: '霧灰色  Free Jazz',  color: '#E2E8F0' },
    { value: '#F5F5DC', label: '奶油白  Bossa Nova', color: '#F5F5DC' },
];

// 以 genre 名稱為 key，供 App.jsx 解析舊格式 mood 字串（如 "Bebop"）
export const GENRE_COLORS = {
    'Swing':     '#FECACA',
    'Hard Bop':  '#FED7AA',
    'Bebop':     '#FDE68A',
    'Soul Jazz': '#D1FAE5',
    'Cool Jazz': '#BFDBFE',
    'Modal':     '#C7D2FE',
    'Fusion':    '#DDD6FE',
    'Latin':     '#FCE7F3',
    'Free Jazz': '#E2E8F0',
    'Bossa Nova':'#F5F5DC',
};
