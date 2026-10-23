// src/components/SearchExplore.jsx
// 依樂手／專輯搜尋所有年份；第一次點進搜尋框才載入其他年份的資料（onOpen），平常瀏覽不受影響
import { useState } from 'react';
import { RetroTitleBar } from './RetroTitleBar';
import { matchesQuery } from '../utils/searchEntries';

const MAX_RESULTS = 30;
const mono = "'Courier New', Courier, monospace";

export const SearchExplore = ({ jazzData, onOpen, onNavigate }) => {
    const [query, setQuery] = useState('');

    const matches = query.trim()
        ? Object.keys(jazzData || {})
            .filter(date => jazzData[date] && matchesQuery({ date, ...jazzData[date] }, query))
            .sort((a, b) => b.localeCompare(a))
        : [];

    const handlePick = (date) => {
        const [y, m, d] = date.split('-').map(Number);
        onNavigate(new Date(y, m - 1, d));
    };

    return (
        <div className="retro-win" style={{ overflow: 'hidden' }}>
            <RetroTitleBar title="SEARCH" mini />

            <div className="retro-body" style={{ padding: '12px' }}>
                <input
                    type="search"
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onFocus={onOpen}
                    placeholder="樂手或專輯，例如 Miles"
                    aria-label="搜尋樂手或專輯"
                    spellCheck={false}
                    style={{
                        width: '100%',
                        fontFamily: mono,
                        fontSize: '13px',
                        color: '#2a1808',
                        background: '#fffaf2',
                        border: '2px solid #3a2808',
                        borderRadius: '2px',
                        padding: '6px 8px',
                        outline: 'none',
                    }}
                />

                {query.trim() && (
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #c8b4a4' }}>
                        <p style={{ fontFamily: mono, fontSize: '11px', color: '#7a5840', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>
                            {matches.length ? `${matches.length} 筆` : '找不到符合的唱片'}
                            {matches.length > MAX_RESULTS && `，顯示最近 ${MAX_RESULTS} 筆`}
                        </p>
                        <ul style={{ maxHeight: '260px', overflowY: 'auto' }}>
                            {matches.slice(0, MAX_RESULTS).map(date => (
                                <li key={date}>
                                    <button
                                        type="button"
                                        onClick={() => handlePick(date)}
                                        style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '5px 0', cursor: 'pointer', borderBottom: '1px dashed #e0d2c2' }}
                                    >
                                        <span style={{ display: 'block', fontFamily: mono, fontSize: '11px', fontWeight: 'bold', color: 'var(--mood-accent)', letterSpacing: '0.05em' }}>
                                            {date}
                                        </span>
                                        <span style={{ display: 'block', fontFamily: mono, fontSize: '12px', fontWeight: 'bold', color: '#2a1808', lineHeight: 1.4 }}>
                                            {jazzData[date].artist}
                                        </span>
                                        <span style={{ display: 'block', fontFamily: mono, fontSize: '11px', fontStyle: 'italic', color: '#7a5840', lineHeight: 1.4 }}>
                                            {jazzData[date].album}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
};
