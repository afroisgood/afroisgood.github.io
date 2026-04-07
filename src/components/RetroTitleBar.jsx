// src/components/RetroTitleBar.jsx
// 共用復古標題列元件 — 用於各 retro-win 視窗頂部

import { IconDisc } from './Icons';

/**
 * @param {string}  title       - 標題文字
 * @param {boolean} mini        - 縮小版（用於 RandomExplore 等小視窗，隱藏 □ 控制鈕）
 * @param {boolean} showDisc    - 是否顯示右側黑膠圖示
 * @param {boolean} isPlaying   - 控制黑膠旋轉動畫
 * @param {string}  className   - 額外 className
 * @param {object}  style       - 額外 inline style
 */
export const RetroTitleBar = ({
    title,
    mini = false,
    showDisc = false,
    isPlaying = false,
    className = '',
    style = {},
}) => (
    <div
        className={`retro-titlebar ${className}`}
        style={{ display: 'flex', alignItems: 'center', gap: mini ? '5px' : '7px', ...(mini ? { padding: '3px 7px', fontSize: '10px' } : {}), ...style }}
    >
        <span className="retro-ctrl" style={mini ? { width: '11px', height: '9px', fontSize: '6px' } : {}}>&#215;</span>
        <span className="retro-ctrl" style={mini ? { width: '11px', height: '9px', fontSize: '6px' } : {}}>&#8722;</span>
        {!mini && <span className="retro-ctrl">&#9633;</span>}
        <span style={{
            flex: 1,
            textAlign: 'center',
            letterSpacing: mini ? '0.15em' : '0.16em',
            ...(mini ? {} : { fontSize: '13px', fontWeight: 'bold' }),
        }}>
            {title}
        </span>
        {showDisc && (
            <IconDisc
                className={`transition-transform duration-1000 ${isPlaying ? 'animate-spin-slow' : ''}`}
                size={11}
                style={{ color: '#e0a870', flexShrink: 0 }}
            />
        )}
    </div>
);
