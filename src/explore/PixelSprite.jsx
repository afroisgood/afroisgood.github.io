import { SPRITE_W, SPRITE_H, spriteRuns } from './sprites';

// 一格像素 = scale 個螢幕像素；flip 為 true 時面朝左
export const PixelSprite = ({ character, frame = 'idle', scale = 4, flip = false, className = '', style }) => (
    <svg
        width={SPRITE_W * scale}
        height={SPRITE_H * scale}
        viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}
        shapeRendering="crispEdges"
        className={className}
        style={{ display: 'block', transform: flip ? 'scaleX(-1)' : undefined, ...style }}
        aria-hidden="true"
    >
        {spriteRuns(character, frame).map((r, i) => (
            <rect key={i} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
        ))}
    </svg>
);
