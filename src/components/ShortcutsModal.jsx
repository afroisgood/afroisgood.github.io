// src/components/ShortcutsModal.jsx
// 鍵盤快捷鍵說明 — 從頂端選單 Help 打開（原本放在桌機側欄）
import { useEffect } from 'react';
import { RetroTitleBar } from './RetroTitleBar';

const SHORTCUTS = [
    ['← →', '切換日期'],
    ['I', '沉浸模式'],
    ['Space', '播放 / 暫停'],
    ['Esc', '退出沉浸'],
];

export const ShortcutsModal = ({ open, onClose }) => {
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/40" onClick={onClose}>
            <div
                role="dialog"
                aria-modal="true"
                aria-label="鍵盤快捷鍵"
                className="retro-win"
                style={{ width: '280px', overflow: 'hidden' }}
                onClick={e => e.stopPropagation()}
            >
                <RetroTitleBar title="KEYBOARD" mini />
                <div className="retro-body" style={{ padding: '16px' }}>
                    {SHORTCUTS.map(([key, label]) => (
                        <div key={key} style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px',
                        }}>
                            <span style={{
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: '11px',
                                fontWeight: 'bold',
                                color: '#f2ece3',
                                background: '#3a2808',
                                border: '1px solid #c8a048',
                                borderRadius: '2px',
                                padding: '1px 6px',
                                letterSpacing: '0.05em',
                                minWidth: '50px',
                                textAlign: 'center',
                                flexShrink: 0,
                            }}>
                                {key}
                            </span>
                            <span style={{
                                fontFamily: "'Courier New', Courier, monospace",
                                fontSize: '12px',
                                color: '#7a5840',
                                letterSpacing: '0.08em',
                            }}>
                                {label}
                            </span>
                        </div>
                    ))}
                    <button type="button" onClick={onClose} className="retro-btn" style={{ marginTop: '10px' }}>
                        關閉
                    </button>
                </div>
            </div>
        </div>
    );
};
