// 探索模式「唱片行」：選角色 → 在店裡走動 → 翻唱片櫃 → 放上唱盤，停在像素唱盤畫面播放
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { findCharacter } from './sprites';
import { buildCrates, shuffled, getYouTubeId } from './crates';
import { CharacterSelect } from './CharacterSelect';
import { ShopFloor } from './ShopFloor';
import { CrateBrowser } from './CrateBrowser';
import { ShopDeck } from './ShopDeck';

const CHARACTER_KEY = 'jazz365_shop_character';

const prefersReducedMotion = () => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

const loadCharacterId = () => {
    try { return localStorage.getItem(CHARACTER_KEY); } catch { return null; }
};

const ShopMode = ({
    data, interactive, nowPlaying, isVinylSpinning,
    player, playerState, playerError, onTogglePlay,
    onStartPlay, onPlay, onRead, onDeckOpenChange,
}) => {
    const [characterId, setCharacterId] = useState(loadCharacterId);
    const [choosing, setChoosing] = useState(() => !findCharacter(characterId));
    const [open, setOpen] = useState(null); // { crate, records, startIndex }
    const [deck, setDeck] = useState(null); // 唱盤畫面：{ record, placing, take }
    const takeRef = useRef(0);
    const crates = useMemo(() => buildCrates(data), [data]);
    const character = findCharacter(characterId);

    const confirmCharacter = (id) => {
        setCharacterId(id);
        setChoosing(false);
        try { localStorage.setItem(CHARACTER_KEY, id); } catch { /* 記不住就下次再選 */ }
    };

    const openCrate = useCallback((crate) => {
        setOpen({ crate, records: crate.shuffle ? shuffled(crate.records) : crate.records });
    }, []);

    // 唱盤畫面上就是正在播的唱片時，App 把底部迷你播放器藏起來（控制都在唱盤畫面上）；
    // 在別處換了唱片（例如閱讀這天後換日期）再回來，唱盤上那張已經停了，迷你播放器照常顯示正在播的
    const deckOwnsPlayer = Boolean(deck) && (deck.placing || nowPlaying?.date === deck.record.date);
    useEffect(() => { onDeckOpenChange?.(deckOwnsPlayer); }, [deckOwnsPlayer, onDeckOpenChange]);

    // 放上唱盤：音樂在點擊當下就開始（iPhone 只允許這時候出聲），
    // 同時切到唱盤畫面播過場；落定（或跳過）後交給 App 換日期、開始播放，畫面停在唱盤上
    const placeRecord = (record) => {
        onStartPlay?.(record);
        const take = ++takeRef.current;
        if (prefersReducedMotion()) {
            setDeck({ record, placing: false, take });
            onPlay(record);
            return;
        }
        setDeck({ record, placing: true, take });
    };
    const finishPlacing = () => {
        if (!deck) return;
        setDeck({ ...deck, placing: false });
        onPlay(deck.record);
    };

    // 同一櫃裡可以播的上一張／下一張（沒有試聽連結的跳過）
    const playableIndex = (step) => {
        const list = open?.records;
        if (!deck || !list) return -1;
        const from = list.findIndex(r => r.date === deck.record.date);
        for (let i = 1; i < list.length; i++) {
            const idx = ((from < 0 ? 0 : from) + step * i + list.length * i) % list.length;
            if (getYouTubeId(list[idx].youtube)) return idx;
        }
        return -1;
    };
    const prevIdx = playableIndex(-1);
    const nextIdx = playableIndex(1);

    // 回到店裡：唱片櫃翻到正在播的這張
    const closeDeck = () => {
        const idx = open?.records.findIndex(r => r.date === deck?.record.date) ?? -1;
        if (open && idx >= 0) setOpen({ ...open, startIndex: idx });
        setDeck(null);
    };

    if (choosing || !character) {
        return (
            <div className="shop-root">
                <CharacterSelect initialId={characterId} onConfirm={confirmCharacter} />
            </div>
        );
    }

    if (crates.length === 0) {
        return (
            <div className="shop-root shop-root--loading">
                <p className="shop-pixel-text">LOADING...</p>
                <p className="shop-select__hint">唱片進貨中</p>
            </div>
        );
    }

    return (
        <div className="shop-root">
            <ShopFloor
                character={character}
                crates={crates}
                enabled={interactive && !open}
                onOpenCrate={openCrate}
                onChangeCharacter={() => setChoosing(true)}
                nowPlaying={nowPlaying}
                isVinylSpinning={isVinylSpinning}
            />
            {open && (
                <CrateBrowser
                    key={open.crate.id + ':' + (open.startIndex ?? 0)}
                    crate={open.crate}
                    records={open.records}
                    startIndex={open.startIndex ?? 0}
                    enabled={interactive && !deck}
                    covered={Boolean(deck)}
                    nowPlayingDate={nowPlaying?.date}
                    onClose={() => setOpen(null)}
                    onPlay={placeRecord}
                    onRead={onRead}
                />
            )}
            {deck && (
                <ShopDeck
                    character={character}
                    record={deck.record}
                    take={deck.take}
                    placing={deck.placing}
                    enabled={interactive}
                    onPlaced={finishPlacing}
                    onDeck={nowPlaying?.date === deck.record.date}
                    player={player}
                    playerState={playerState}
                    playerError={playerError}
                    onTogglePlay={onTogglePlay}
                    onReplay={() => placeRecord(deck.record)}
                    onPrev={prevIdx >= 0 ? () => placeRecord(open.records[prevIdx]) : null}
                    onNext={nextIdx >= 0 ? () => placeRecord(open.records[nextIdx]) : null}
                    onBack={closeDeck}
                    onRead={() => onRead(deck.record)}
                />
            )}
        </div>
    );
};

export default ShopMode;
