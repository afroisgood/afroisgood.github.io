// src/components/CopyrightFooter.jsx
// 共用版權聲明 — Sidebar（light）與 MobileNav（dark）共用

export const CopyrightFooter = ({ theme = 'light' }) => {
    const isDark = theme === 'dark';

    const containerStyle = isDark ? {
        marginTop: '24px',
        paddingTop: '16px',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        fontSize: '11px',
        lineHeight: 1.8,
        color: 'rgba(255,255,255,0.55)',
    } : {
        fontSize: '11px',
        lineHeight: 1.7,
        color: '#7a5840',
    };

    const linkColor = isDark ? 'rgba(255,255,255,0.75)' : '#5a3820';

    return (
        <div style={{ fontFamily: "'Courier New', Courier, monospace", letterSpacing: '0.03em', ...containerStyle }}>
            <p>© 2026 ジャズ録音日調査委員会. All editorial rights reserved.</p>
            <p>Music and recordings remain the property of their respective rights holders.</p>
            <p style={{ marginTop: isDark ? '8px' : '6px' }}>For corrections or feedback, please contact:</p>
            <p>如有任何指正或回饋，歡迎來信：</p>
            <p>
                和煦人 —{' '}
                <a
                    href="mailto:monkeyboy2766@gmail.com"
                    style={{ color: linkColor, textDecoration: 'underline' }}
                >
                    monkeyboy2766@gmail.com
                </a>
            </p>
        </div>
    );
};
