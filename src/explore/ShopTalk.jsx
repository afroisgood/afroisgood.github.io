// 跟店長說話：店長遞一張唱片，可以直接放上唱盤，或請他再推薦一張
import { useEffect, useRef } from 'react';
import { SHOPKEEPER } from './sprites';
import { PixelSprite } from './PixelSprite';
import { Cover } from './CrateBrowser';
import { formatRecordDate, getYouTubeId } from './crates';

export const ShopTalk = ({ talk, enabled, nowPlayingDate, canRecommend, onPlay, onRead, onAnother, onClose }) => {
    const { record, line, quoteLabel, quote } = talk;
    const onDeck = nowPlayingDate === record.date;
    const canPlay = Boolean(getYouTubeId(record.youtube));
    const primaryRef = useRef(null);

    // 每換一張就把焦點放回主要按鈕，用鍵盤的人按 Enter 就能聽
    useEffect(() => { primaryRef.current?.focus({ preventScroll: true }); }, [record.date]);

    useEffect(() => {
        if (!enabled) return;
        const onKey = (e) => {
            if (e.metaKey || e.ctrlKey || e.altKey) return;
            if (e.key === 'Escape') { e.preventDefault(); onClose(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [enabled, onClose]);

    return (
        <div className="shop-talk" role="dialog" aria-modal="true" aria-label="跟店長說話">
            <div className="shop-talk__box">
                <div className="shop-talk__head">
                    <span className="shop-talk__portrait">
                        <PixelSprite character={SHOPKEEPER} scale={3} flip style={{ marginTop: 6 }} />
                    </span>
                    <div className="shop-talk__speech">
                        <p className="shop-pixel-text shop-talk__name">SHOPKEEPER</p>
                        <p key={record.date} className="shop-talk__line">{line}</p>
                    </div>
                    <button type="button" className="shop-btn shop-btn--square shop-talk__close" onClick={onClose} aria-label="結束對話">✕</button>
                </div>

                <div className="shop-talk__record">
                    <div key={record.date} className="shop-talk__cover">
                        <Cover record={record} />
                        {onDeck && <span className="shop-pixel-text crate-cover__playing">ON DECK</span>}
                    </div>
                    <div className="shop-talk__info">
                        <p className="crate-browser__date">{formatRecordDate(record.date)}</p>
                        <h3 className="crate-browser__album font-playfair">{record.album}</h3>
                        <p className="crate-browser__artist">{record.artist}</p>
                    </div>
                </div>

                {quote && (
                    <div className="crate-pop shop-talk__quote">
                        <span className="crate-pop__label">{quoteLabel}</span>
                        <p className="crate-pop__text">{quote}</p>
                    </div>
                )}

                <div className="crate-browser__actions">
                    {canPlay ? (
                        <button ref={primaryRef} type="button" className="shop-btn shop-btn--primary" disabled={onDeck} onClick={() => onPlay(record)}>
                            {onDeck ? '♪ 唱盤上' : '▶ 放上唱盤'}
                        </button>
                    ) : (
                        <button ref={primaryRef} type="button" className="shop-btn shop-btn--primary" onClick={() => onRead(record)}>閱讀這天 →</button>
                    )}
                    {canRecommend && <button type="button" className="shop-btn" onClick={onAnother}>再推薦一張</button>}
                </div>
            </div>
        </div>
    );
};
