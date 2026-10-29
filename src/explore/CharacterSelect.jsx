// 進店前選角色：角色只差外觀，選好的會記在這台裝置上
import { useState } from 'react';
import { CHARACTERS } from './sprites';
import { PixelSprite } from './PixelSprite';
import { useWalkCycle } from './useWalkCycle';

const CharacterCard = ({ character, selected, onSelect, onConfirm }) => {
    const frame = useWalkCycle(selected, 6);
    return (
        <button
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => (selected ? onConfirm() : onSelect(character.id))}
            className={'shop-char-card ' + (selected ? 'shop-char-card--selected' : '')}
        >
            <span className="shop-char-card__stage">
                <PixelSprite character={character} frame={frame} scale={4} />
            </span>
            <span className="shop-char-card__name">{character.name}</span>
            <span className="shop-pixel-text shop-char-card__tag">{character.tag}</span>
        </button>
    );
};

export const CharacterSelect = ({ initialId, onConfirm }) => {
    const [selectedId, setSelectedId] = useState(initialId || CHARACTERS[0].id);
    const confirm = () => onConfirm(selectedId);

    return (
        <div className="shop-select">
            <p className="shop-pixel-text shop-select__eyebrow">JAZZ 365 RECORDS</p>
            <h2 className="shop-select__title">選一個角色，走進唱片行</h2>
            <p className="shop-select__hint">翻翻唱片櫃，挑一張放上唱盤</p>

            <div role="radiogroup" aria-label="角色" className="shop-select__grid">
                {CHARACTERS.map(c => (
                    <CharacterCard
                        key={c.id}
                        character={c}
                        selected={c.id === selectedId}
                        onSelect={setSelectedId}
                        onConfirm={confirm}
                    />
                ))}
            </div>

            <button type="button" className="shop-btn shop-btn--primary" onClick={confirm}>
                進入唱片行 ▶
            </button>
        </div>
    );
};
