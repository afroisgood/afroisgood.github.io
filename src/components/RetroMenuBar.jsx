// src/components/RetroMenuBar.jsx
import { useState, useEffect, useRef } from 'react';
import { CONTACT_EMAIL } from './CopyrightFooter';

const DAYS   = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

// 經典 Mac 選單：點一下打開，選單開著時滑到另一個選單名稱就直接換過去；
// 點選項、點選單外面或按 Esc 關閉。只在桌機版（lg 以上）顯示。
const MenuItem = ({ label, onSelect, disabled = false, checked = false, href }) => {
    const content = (
        <>
            <span className="retro-menu-check" aria-hidden="true">{checked ? '✓' : ''}</span>
            {label}
        </>
    );
    return href ? (
        <a role="menuitem" href={href} className="retro-menu-item" onClick={onSelect}>{content}</a>
    ) : (
        <button type="button" role="menuitem" className="retro-menu-item" disabled={disabled} onClick={onSelect}>{content}</button>
    );
};

export const RetroMenuBar = ({
    viewMode,
    onViewModeChange,
    canImmerse,
    onImmerse,
    onToday,
    onShowShortcuts,
    onShowChangelog,
}) => {
    const [now, setNow] = useState(new Date());
    const [openMenu, setOpenMenu] = useState(null); // 'view' | 'help' | null
    const menusRef = useRef(null);

    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(id);
    }, []);

    useEffect(() => {
        if (!openMenu) return;
        const onPointerDown = (e) => { if (!menusRef.current?.contains(e.target)) setOpenMenu(null); };
        const onKey = (e) => { if (e.key === 'Escape') setOpenMenu(null); };
        document.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('keydown', onKey);
        };
    }, [openMenu]);

    const day  = DAYS[now.getDay()];
    const date = String(now.getDate()).padStart(2, '0');
    const mon  = MONTHS[now.getMonth()];
    const year = now.getFullYear();
    const hh   = String(now.getHours()).padStart(2, '0');
    const mm   = String(now.getMinutes()).padStart(2, '0');

    const pick = (action) => () => { setOpenMenu(null); action?.(); };

    const menuTrigger = (name, label) => (
        <button
            type="button"
            className="retro-menu-trigger"
            aria-haspopup="menu"
            aria-expanded={openMenu === name}
            onClick={() => setOpenMenu(openMenu === name ? null : name)}
            onMouseEnter={() => { if (openMenu && openMenu !== name) setOpenMenu(name); }}
        >
            {label}
        </button>
    );

    return (
        <div className="retro-menubar">
            {/* Left: brand + menus */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 'bold', opacity: 0.95, whiteSpace: 'nowrap' }}>&#9835; JAZZ 365</span>
                <span className="hidden lg:inline" style={{ opacity: 0.2 }}>|</span>
                <div ref={menusRef} className="hidden lg:flex" style={{ alignItems: 'center', gap: '4px' }}>
                    <div style={{ position: 'relative' }}>
                        {menuTrigger('view', 'View')}
                        {openMenu === 'view' && (
                            <div role="menu" aria-label="View" className="retro-menu-dropdown">
                                <MenuItem label="單日" checked={viewMode === 'day'} onSelect={pick(() => onViewModeChange('day'))} />
                                <MenuItem label="唱片牆" checked={viewMode === 'wall'} onSelect={pick(() => onViewModeChange('wall'))} />
                                <div className="retro-menu-sep" role="separator" />
                                <MenuItem label="沉浸聆聽" disabled={!canImmerse} onSelect={pick(onImmerse)} />
                                <MenuItem label="回到今天" onSelect={pick(onToday)} />
                            </div>
                        )}
                    </div>
                    <div style={{ position: 'relative' }}>
                        {menuTrigger('help', 'Help')}
                        {openMenu === 'help' && (
                            <div role="menu" aria-label="Help" className="retro-menu-dropdown">
                                <MenuItem label="鍵盤快捷鍵" onSelect={pick(onShowShortcuts)} />
                                <MenuItem label="更新日誌" onSelect={pick(onShowChangelog)} />
                                <div className="retro-menu-sep" role="separator" />
                                <MenuItem label="回饋與指正" href={`mailto:${CONTACT_EMAIL}`} onSelect={pick()} />
                            </div>
                        )}
                    </div>
                </div>
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
