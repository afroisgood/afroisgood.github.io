// 探索模式「唱片行」：選角色 → 在店裡走動 → 翻唱片櫃 → 放上唱盤（交給 App 開沉浸模式播放）
import { useCallback, useMemo, useState } from 'react';
import { findCharacter } from './sprites';
import { buildCrates, shuffled } from './crates';
import { CharacterSelect } from './CharacterSelect';
import { ShopFloor } from './ShopFloor';
import { CrateBrowser } from './CrateBrowser';

const CHARACTER_KEY = 'jazz365_shop_character';

const loadCharacterId = () => {
    try { return localStorage.getItem(CHARACTER_KEY); } catch { return null; }
};

const ShopMode = ({ data, interactive, nowPlaying, isVinylSpinning, onPlay, onRead }) => {
    const [characterId, setCharacterId] = useState(loadCharacterId);
    const [choosing, setChoosing] = useState(() => !findCharacter(characterId));
    const [open, setOpen] = useState(null); // { crate, records }
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
                    key={open.crate.id}
                    crate={open.crate}
                    records={open.records}
                    enabled={interactive}
                    nowPlayingDate={nowPlaying?.date}
                    onClose={() => setOpen(null)}
                    onPlay={onPlay}
                    onRead={onRead}
                />
            )}
        </div>
    );
};

export default ShopMode;
