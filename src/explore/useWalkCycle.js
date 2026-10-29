import { useEffect, useState } from 'react';

const CYCLE = ['stride', 'idle', 'pass', 'idle'];

// 走路時每 1/fps 秒換一格腳步，停下來就回到站姿
export const useWalkCycle = (walking, fps = 8) => {
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!walking) return;
        const id = setInterval(() => setStep(s => (s + 1) % CYCLE.length), 1000 / fps);
        return () => clearInterval(id);
    }, [walking, fps]);

    return walking ? CYCLE[step] : 'idle';
};
