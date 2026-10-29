// 唱片行的唱片櫃：從已公開的每日推薦排出來。
// 由門口往裡走：新進唱片 → 店長精選 → 各月份（越往裡越早）→ 最裡面的盲抽箱。

const MONTH_LABELS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

/** "2026-10-29" → "2026.10.29 THU" */
export const formatRecordDate = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} ${WEEKDAYS[new Date(y, m - 1, d).getDay()]}`;
};

export const getYouTubeId = (url) => {
    const match = url?.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/);
    return match && match[2].length === 11 ? match[2] : null;
};

export const coverSrc = (record) => {
    if (record.imageUrl) return record.imageUrl;
    const yt = getYouTubeId(record.youtube);
    return yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null;
};

export const buildCrates = (data) => {
    const newestFirst = Object.keys(data).sort().reverse().map(date => ({ ...data[date], date }));
    if (newestFirst.length === 0) return [];

    const crates = [
        { id: 'new', label: 'NEW', sub: 'IN', title: '新進唱片', desc: '最近七天的推薦', records: newestFirst.slice(0, 7) },
    ];

    const picks = newestFirst.filter(r => r.editorNote?.trim() || r.albumNotes?.trim());
    if (picks.length) {
        crates.push({ id: 'picks', label: 'PICK', sub: 'STAFF', title: '店長精選', desc: '有石編的話或專輯補充的唱片', records: picks });
    }

    const byMonth = new Map();
    newestFirst.forEach(r => {
        const ym = r.date.slice(0, 7);
        if (!byMonth.has(ym)) byMonth.set(ym, []);
        byMonth.get(ym).push(r);
    });
    byMonth.forEach((records, ym) => {
        const [year, month] = ym.split('-').map(Number);
        crates.push({
            id: 'm-' + ym,
            label: MONTH_LABELS[month - 1],
            sub: String(year),
            title: `${year} 年 ${month} 月`,
            desc: '照日期排，從 1 號開始翻',
            records: records.slice().reverse(),
        });
    });

    crates.push({ id: 'random', label: '???', sub: 'LUCKY', title: '盲抽箱', desc: '每次打開都重新洗牌', records: newestFirst, shuffle: true });
    return crates;
};

export const shuffled = (list) => {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};
