// src/components/RetroMenuBar.jsx
import { useState, useEffect } from 'react';

const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

export const RetroMenuBar = () => {
    const [now, setNow] = useState(new Date());

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(id);
    }, []);

    const day  = DAYS[now.getDay()];
    const date = String(now.getDate()).padStart(2, '0');
    const mon  = MONTHS[now.getMonth()];
    const year = now.getFullYear();
    const hh   = String(now.getHours()).padStart(2, '0');
    const mm   = String(now.getMinutes()).padStart(2, '0');

    return (
        <div className="retro-menubar">
            {/* Left: brand + fake menus */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 'bold', opacity: 0.95, whiteSpace: 'nowrap' }}>&#9835; 日めくりジャズ365</span>
                <span className="hidden sm:inline" style={{ opacity: 0.2 }}>|</span>
                <span className="hidden sm:inline" style={{ opacity: 0.5, cursor: 'default' }}>File</span>
                <span className="hidden sm:inline" style={{ opacity: 0.5, cursor: 'default' }}>View</span>
                <span className="hidden sm:inline" style={{ opacity: 0.5, cursor: 'default' }}>Help</span>
            </div>
            {/* Right: live date + time */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', opacity: 0.72, whiteSpace: 'nowrap' }}>
                <span className="hidden sm:inline">{day} {date} {mon} {year}</span>
                <span className="hidden sm:inline" style={{ opacity: 0.35 }}>|</span>
                <span>{hh}:{mm}</span>
            </div>
        </div>
    );
};
