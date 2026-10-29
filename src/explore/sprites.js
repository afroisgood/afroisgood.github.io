// 唱片行的像素角色：16×24 格，面朝右畫，往左走時整張水平翻轉。
// 每個角色 = 共用的頭／身體／腿 + 髮型或配件疊圖 + 自己的色票；角色只差外觀。
// 字元對照：. 透明、K 輪廓、S 皮膚、E 眼睛、H 頭髮、T 上衣、t 袖子、P 褲子、B 鞋子，其餘是配件色。

const HEAD = [
    '................',
    '.....KKKKKK.....',
    '....KSSSSSSK....',
    '...KSSSSSSSSK...',
    '...KSSSSSSSSK...',
    '...KSSSSSSSSK...',
    '...KSSSSESSEK...',
    '...KSSSSSSSSSK..',
    '....KSSSSSSSK...',
    '.....KKSSKKK....',
];

const BODY = [
    '....KTTTTTTK....',
    '...KTTTTTTTTK...',
    '...KtTTTTTTtK...',
    '...KtTTTTTTtK...',
    '...KtTTTTTTtK...',
    '...KSTTTTTTSK...',
    '....KPPPPPPK....',
    '....KPPPPPPK....',
];

const LEGS = {
    idle: [
        '....KPPKKPPK....',
        '....KPPKKPPK....',
        '....KPPKKPPK....',
        '....KPPKKPPK....',
        '....KBBKKBBK....',
        '....KBBBKBBBK...',
    ],
    stride: [
        '....KPPPPPPK....',
        '...KPPK..KPPK...',
        '...KPPK..KPPK...',
        '..KPPK....KPPK..',
        '..KBBK....KBBK..',
        '.KBBBK....KBBBK.',
    ],
    pass: [
        '....KPPPPPPK....',
        '.....KPPPPK.....',
        '.....KPPPPK.....',
        '.....KPPPPK.....',
        '.....KBBBBK.....',
        '.....KBBBBBK....',
    ],
};

// 疊圖：從第 0 列開始蓋上去，'.' 不覆蓋
const OVERLAYS = {
    afro: [
        '....KKKKKKK.....',
        '...KHHHHHHHK....',
        '..KHHHHHHHHHK...',
        '.KHHHHHHHHHHHK..',
        '.KHHHHHHHHHHHK..',
        '.KHHHH......HK..',
        '.KHHH...........',
        '..KHH...........',
        '...KK...........',
    ],
    fedora: [
        '.....KKKKKK.....',
        '....KAAAAAAK....',
        '....KaaaaaaK....',
        '..KKAAAAAAAAKK..',
        '...KHHHKKKKK....',
        '....HH..........',
    ],
    long: [
        '.....KKKKKK.....',
        '....KHHHHHHK....',
        '...KHHHHHHHHK...',
        '..KHHHHHHHHHK...',
        '..KHHHH.........',
        '..KHHH..........',
        '..KHHH..........',
        '..KHHHH.........',
        '..KHHHH.........',
        '..KHHH..........',
        '..KHHH..........',
        '..KHHH..........',
        '...KK...........',
    ],
    headphones: [
        '.....DDDDDD.....',
        '....DKKKKKKD....',
        '...KDHHHHHHDK...',
        '...KHHHHHHHHK...',
        '...KHHHHHHHHK...',
        '....HRR.........',
        '....HRR.........',
        '.....RR.........',
    ],
};

const OUTLINE = '#1c1410';

export const CHARACTERS = [
    {
        id: 'afro',
        name: '爆炸頭',
        tag: 'GROOVE',
        overlay: 'afro',
        palette: { S: '#8d5a3b', H: '#2a1a12', T: '#e0a030', t: '#c48420', P: '#4a3428', B: '#1c1410' },
    },
    {
        id: 'gent',
        name: '老派紳士',
        tag: 'CLASSIC',
        overlay: 'fedora',
        palette: { S: '#f0c8a0', H: '#6b5444', T: '#2f3a52', t: '#232c40', P: '#6e6a66', B: '#3a2410', A: '#3a3430', a: '#b4513a' },
    },
    {
        id: 'long',
        name: '長髮樂迷',
        tag: 'SOUL',
        overlay: 'long',
        palette: { S: '#f3d2b3', H: '#1c1410', T: '#b4513a', t: '#8f3d2c', P: '#34466e', B: '#e8e0d0' },
    },
    {
        id: 'student',
        name: '耳機少年',
        tag: 'FRESH',
        overlay: 'headphones',
        palette: { S: '#e8b890', H: '#3a2418', T: '#3d6b48', t: '#2e5236', P: '#b8a07a', B: '#f2ece3', D: '#3a3a3a', R: '#c8a048' },
    },
];

// 櫃台後面的店長，不能選
export const SHOPKEEPER = {
    id: 'keeper',
    overlay: 'afro',
    palette: { S: '#6e4430', H: '#d9cbb4', T: '#7a3b2e', t: '#5e2c22', P: '#2a1a12', B: '#1c1410' },
};

export const findCharacter = (id) => CHARACTERS.find(c => c.id === id) || null;

export const SPRITE_W = 16;
export const SPRITE_H = 24;

// 把格子轉成同色的水平線段，一列一段一個 <rect>，元素數少很多
const toRuns = (grid, palette) => {
    const runs = [];
    grid.forEach((row, y) => {
        let x = 0;
        while (x < row.length) {
            const ch = row[x];
            if (ch === '.') { x++; continue; }
            let end = x + 1;
            while (end < row.length && row[end] === ch) end++;
            const fill = ch === 'K' || ch === 'E' ? OUTLINE : palette[ch];
            if (fill) runs.push({ x, y, w: end - x, fill });
            x = end;
        }
    });
    return runs;
};

const compose = (character, legs) => {
    const grid = [...HEAD, ...BODY, ...LEGS[legs]].map(row => row.split(''));
    (OVERLAYS[character.overlay] || []).forEach((row, y) => {
        row.split('').forEach((ch, x) => { if (ch !== '.') grid[y][x] = ch; });
    });
    return grid.map(row => row.join(''));
};

const frameCache = new Map();

/** 角色某一格動作的線段，frame：'idle' | 'stride' | 'pass' */
export const spriteRuns = (character, frame) => {
    const key = character.id + ':' + frame;
    if (!frameCache.has(key)) frameCache.set(key, toRuns(compose(character, frame), character.palette));
    return frameCache.get(key);
};
