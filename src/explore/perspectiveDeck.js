// 落針後的透視唱盤（斜上方一點透視）：桌面木紋朝同一個消失點收、底座看得到前側面、轉盤和唱片是橢圓。
// 全部在 180×105 格的座標裡用程式算出像素，再交給 ShopDeck 畫成 SVG。
// 唱片不能直接旋轉（會破壞像素），改成預先算好 8 格轉動角度輪播；標籤是這張專輯的像素封面。
import { COVER_SIZE, LABEL_R, toRuns } from './coverPixels';

export const SCENE_W = 180;
export const SCENE_H = 105;

// 轉盤中心與唱片橢圓（y 方向壓成 0.44）
export const DISC_CX = 78;
export const DISC_CY = 46;
const DISC_SQUASH = 0.44;
export const FRAME_W = 50;
export const FRAME_H = 24;
export const FRAMES = 8;

// 唱臂支點、落在唱片最外圈時唱頭的位置
export const ARM_PIVOT_X = 124;
export const ARM_PIVOT_Y = 35;
const ARM_TIP_X = 100;
const ARM_TIP_Y = 48;

const VP = { x: 90, y: -60 }; // 消失點
const toward = (x, y0, y1) => x + (VP.x - x) * ((y1 - y0) / (VP.y - y0)); // 從 (x,y0) 沿透視線走到 y1 的 x

const blank = (w, h) => Array.from({ length: h }, () => Array(w).fill(null));

const buildScene = () => {
    const g = blank(SCENE_W, SCENE_H);
    const fill = (x0, x1, y, c) => {
        for (let x = Math.max(0, Math.round(x0)); x < Math.min(SCENE_W, Math.round(x1)); x++) g[y][x] = c;
    };
    const ell = (cx, cy, rx, ry, c) => {
        for (let y = Math.floor(cy - ry); y < Math.ceil(cy + ry); y++) {
            const dy = (y + 0.5 - cy) / ry;
            if (Math.abs(dy) > 1) continue;
            const half = rx * Math.sqrt(1 - dy * dy);
            fill(cx - half, cx + half, y, c);
        }
    };
    // 牆
    for (let y = 0; y < 24; y++) for (let x = 0; x < SCENE_W; x++) g[y][x] = x % 12 === 0 ? '#3d261b' : '#4a2f22';
    for (let y = 0; y < 3; y++) fill(0, SCENE_W, y, '#2a1a12');
    for (let y = 22; y < 24; y++) fill(0, SCENE_W, y, '#2a1a12');
    // 桌面：梯形，木紋線朝消失點收
    for (let y = 24; y < 74; y++) {
        const l = toward(0, 74, y), r = toward(180, 74, y);
        fill(l, r, y, y < 26 ? '#6b4630' : '#5a3a28');
        for (const fx of [-60, -20, 20, 60, 100, 140, 180, 220]) {
            const sx = Math.round(toward(fx, 74, y));
            if (sx > l && sx < r - 1) g[y][sx] = '#4a2f22';
        }
    }
    for (let y = 74; y < 82; y++) fill(0, SCENE_W, y, y === 74 ? '#8a5a3a' : y > 79 ? '#2a1a12' : '#3a2418');
    // 地板：跟店裡一樣的格子
    for (let y = 82; y < SCENE_H; y++) {
        for (let x = 0; x < SCENE_W; x++) g[y][x] = ((Math.floor(x / 8) + Math.floor((y - 82) / 6)) % 2) ? '#b39c78' : '#d9c7a5';
    }
    // 唱盤底座：頂面梯形 + 前側面 + 腳
    for (let y = 30; y < 62; y++) {
        const l = toward(38, 62, y), r = toward(142, 62, y);
        fill(l, r, y, y === 30 ? '#8a5a3a' : '#6b4630');
        g[y][Math.round(l)] = '#1c1410';
        g[y][Math.round(r) - 1] = '#1c1410';
    }
    fill(toward(38, 62, 29), toward(142, 62, 29), 29, '#1c1410');
    for (let y = 62; y < 69; y++) fill(38, 142, y, y === 62 ? '#8a5a3a' : '#4a2f22');
    fill(38, 142, 69, '#1c1410');
    fill(42, 48, 70, '#1c1410');
    fill(132, 138, 70, '#1c1410');
    // 轉盤：先畫下方厚度，再畫頂面
    ell(DISC_CX, DISC_CY + 2.5, 28, 12.5, '#151010');
    ell(DISC_CX, DISC_CY, 28, 12.5, '#1c1410');
    ell(DISC_CX, DISC_CY, 26.5, 11.6, '#3a3430');
    ell(DISC_CX, DISC_CY, 25, 11, '#2a2420');
    // 唱臂底座（小圓柱）與按鈕
    ell(ARM_PIVOT_X, ARM_PIVOT_Y + 4, 5, 2.5, '#4a4440');
    for (let y = ARM_PIVOT_Y; y < ARM_PIVOT_Y + 4; y++) fill(ARM_PIVOT_X - 5, ARM_PIVOT_X + 5, y, '#6e6a66');
    ell(ARM_PIVOT_X, ARM_PIVOT_Y, 5, 2.5, '#9a948c');
    ell(ARM_PIVOT_X, ARM_PIVOT_Y, 2, 1, '#4a4440');
    fill(118, 132, 54, '#2a1a12');
    fill(118, 132, 55, '#2a1a12');
    fill(120, 124, 55, '#b4513a');
    fill(126, 130, 55, '#c8a048');
    return toRuns(g);
};

let sceneRuns = null;
export const perspectiveSceneRuns = () => (sceneRuns ??= buildScene());

/** 8 格轉動中的唱片；px 是像素封面顏色（沒有就用金色標籤） */
export const perspectiveDiscFrames = (px) => Array.from({ length: FRAMES }, (_, f) => {
    const th = (f * Math.PI * 2) / FRAMES;
    const g = blank(FRAME_W, FRAME_H);
    for (let y = 0; y < FRAME_H; y++) {
        for (let x = 0; x < FRAME_W; x++) {
            const dx = x + 0.5 - FRAME_W / 2;
            const dy = (y + 0.5 - FRAME_H / 2) / DISC_SQUASH;
            const r = Math.hypot(dx, dy);
            if (r > 24) continue;
            // 唱片自己的座標（跟著轉）
            const u = dx * Math.cos(th) + dy * Math.sin(th);
            const v = -dx * Math.sin(th) + dy * Math.cos(th);
            let c = r > 23 ? '#0e0a0a' : '#151010';
            for (const k of [21, 18, 15, 12]) if (Math.abs(r - k) < 0.7) c = '#2e2622';
            // 反光固定在畫面同一處，不跟著轉
            const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
            if (r > 11 && r < 22.5 && ang > -150 && ang < -110) c = r % 3 < 1.5 ? '#4a4440' : '#3a3430';
            if (r < LABEL_R) {
                if (px) {
                    const ix = Math.min(COVER_SIZE - 1, Math.max(0, Math.floor(u + LABEL_R)));
                    const iy = Math.min(COVER_SIZE - 1, Math.max(0, Math.floor(v + LABEL_R)));
                    c = px[iy * COVER_SIZE + ix];
                } else {
                    c = (Math.abs(v + 3.5) < 0.9 && Math.abs(u) < 6) || (Math.abs(v - 2.5) < 0.9 && Math.abs(u) < 4) ? '#7a3b2e' : '#c8a048';
                }
            }
            if (r < 1.6) c = '#1c1410';
            g[y][x] = c;
        }
    }
    return toRuns(g);
});

// 唱臂（落在最外圈的姿勢）：兩格粗的線，加上唱頭
const buildArm = () => {
    const runs = [];
    const n = Math.max(Math.abs(ARM_TIP_X - ARM_PIVOT_X), Math.abs(ARM_TIP_Y - ARM_PIVOT_Y));
    for (let i = 0; i <= n; i++) {
        const x = Math.round(ARM_PIVOT_X + ((ARM_TIP_X - ARM_PIVOT_X) * i) / n);
        const y = Math.round(ARM_PIVOT_Y + ((ARM_TIP_Y - ARM_PIVOT_Y) * i) / n);
        runs.push({ x, y, w: 1, fill: '#c9c3b8' }, { x, y: y + 1, w: 1, fill: '#9a948c' });
    }
    for (let y = ARM_TIP_Y - 1; y < ARM_TIP_Y + 3; y++) runs.push({ x: ARM_TIP_X - 4, y, w: 6, fill: '#2a2420' });
    runs.push({ x: ARM_TIP_X - 3, y: ARM_TIP_Y, w: 4, fill: '#c8a048' });
    runs.push({ x: ARM_TIP_X - 2, y: ARM_TIP_Y + 3, w: 1, fill: '#9a948c' });
    return runs;
};
export const perspectiveArmRuns = buildArm();

// 唱臂姿勢：架上（轉向前方、看起來變短）、最外圈、最內圈。透視下唱臂長度會變，用縮放近似
export const ARM_REST = { deg: -55, scale: 0.62 };
export const ARM_OUTER = { deg: 0, scale: 1 };
export const ARM_INNER = { deg: 10, scale: 1.4 };
