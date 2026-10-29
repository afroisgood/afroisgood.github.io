// 翻唱片：一次看一張，左右翻；抽到喜歡的就放上唱盤，直接進沉浸模式播放
import { useEffect, useRef, useState } from 'react';
import { coverSrc, getYouTubeId } from './crates';

const WEEKDAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

const formatRecordDate = (key) => {
    const [y, m, d] = key.split('-').map(Number);
    return `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')} ${WEEKDAYS[new Date(y, m - 1, d).getDay()]}`;
};

const Cover = ({ record }) => {
    const [broken, setBroken] = useState(false);
    const src = coverSrc(record);
    return src && !broken ? (
        <img src={src} alt={`${record.artist}《${record.album}》封面`} onError={() => setBroken(true)} className="w-full h-full object-cover" />
    ) : (
        <span className="crate-cover__blank font-playfair">{record.album}</span>
    );
};

export const CrateBrowser = ({ crate, records, enabled, nowPlayingDate, onClose, onPlay, onRead }) => {
    const [index, setIndex] = useState(0);
    const [dir, setDir] = useState(1);
    const swipeRef = useRef(null);
    const closeRef = useRef(null);
    const record = records[index];
    const onDeck = nowPlayingDate === record?.date;
    // 已經在唱盤上的這張不再放一次（會重播過場、歌也從頭開始），改用底部播放器控制
    const canPlay = Boolean(getYouTubeId(record?.youtube)) && !onDeck;
    const note = record?.editorNote?.trim();
    const albumNote = record?.albumNotes?.trim();

    const flip = (step) => {
        if (records.length < 2) return;
        setDir(step);
        setIndex(i => (i + step + records.length) % records.length);
    };

    useEffect(() => { closeRef.current?.focus(); }, []);

    useEffect(() => {
        if (!enabled) return;
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
            else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') { e.preventDefault(); flip(-1); }
            else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') { e.preventDefault(); flip(1); }
            else if (e.key === 'Enter' && !e.target.closest?.('button, a') && canPlay) { e.preventDefault(); onPlay(record); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    if (!record) return null;

    const onPointerDown = (e) => { swipeRef.current = e.clientX; };
    const onPointerUp = (e) => {
        if (swipeRef.current === null) return;
        const dx = e.clientX - swipeRef.current;
        swipeRef.current = null;
        if (Math.abs(dx) > 40) flip(dx < 0 ? 1 : -1);
    };

    return (
        <div className="crate-browser" role="dialog" aria-modal="true" aria-label={`翻唱片：${crate.title}`}>
            <header className="crate-browser__head">
                <div>
                    <p className="shop-pixel-text crate-browser__eyebrow">{crate.label} {crate.sub}</p>
                    <h3 className="crate-browser__title">{crate.title}</h3>
                    <p className="crate-browser__desc">{crate.desc}</p>
                </div>
                <button ref={closeRef} type="button" className="shop-btn" onClick={onClose}>✕ 放回去</button>
            </header>

            <div className="crate-browser__body">
                <div className="crate-browser__stage">
                    <button type="button" className="shop-btn shop-btn--square" onClick={() => flip(-1)} disabled={records.length < 2} aria-label="上一張">‹</button>
                    <div
                        key={record.date + ':' + index}
                        className={'crate-cover ' + (dir > 0 ? 'crate-cover--next' : 'crate-cover--prev')}
                        onPointerDown={onPointerDown}
                        onPointerUp={onPointerUp}
                        onPointerCancel={() => { swipeRef.current = null; }}
                    >
                        <Cover record={record} />
                        {onDeck && <span className="shop-pixel-text crate-cover__playing">ON DECK</span>}
                    </div>
                    <button type="button" className="shop-btn shop-btn--square" onClick={() => flip(1)} disabled={records.length < 2} aria-label="下一張">›</button>
                </div>
                <p className="shop-pixel-text crate-browser__count">{index + 1} / {records.length}</p>

                <div className="crate-browser__info">
                    <p className="crate-browser__date">{formatRecordDate(record.date)}</p>
                    <h4 className="crate-browser__album font-playfair">{record.album}</h4>
                    <p className="crate-browser__artist">{record.artist}</p>

                    <div className="crate-browser__actions">
                        <button type="button" className="shop-btn shop-btn--primary" disabled={!canPlay} onClick={() => onPlay(record)}>
                            {onDeck ? '♪ 唱盤上' : '▶ 放上唱盤'}
                        </button>
                        <button type="button" className="shop-btn" onClick={() => onRead(record)}>閱讀這天 →</button>
                    </div>
                    {!canPlay && !onDeck && <p className="crate-browser__desc">這張沒有試聽連結，可以先看這天的文章</p>}

                    {(note || albumNote) && (
                        <div className="crate-pop">
                            <span className="crate-pop__label">{note ? '石編的話' : '專輯補充'}</span>
                            <p className="crate-pop__text">{note || albumNote}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
