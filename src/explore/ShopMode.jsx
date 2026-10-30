// 探索模式「唱片行」：選角色 → 在店裡走動 → 翻唱片櫃（或跟櫃台的店長說話，讓他遞一張）→ 放上唱盤，停在像素唱盤畫面播放
// 連續播放開著時，一張播完自動換同一櫃的下一張：在唱盤畫面上會演「拿走舊唱片、放上新唱片」，回到店裡逛時只換歌
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { findCharacter } from './sprites';
import { buildCrates, shuffled, getYouTubeId, sortNewestFirst } from './crates';
import { talkFor, todayRecord, recommend } from './shopkeeper';
import { formatDateString } from '../utils/dateUtils';
import { CharacterSelect } from './CharacterSelect';
import { ShopFloor } from './ShopFloor';
import { CrateBrowser } from './CrateBrowser';
import { ShopTalk } from './ShopTalk';
import { ShopDeck } from './ShopDeck';

const CHARACTER_KEY = 'jazz365_shop_character';
const AUTO_NEXT_KEY = 'jazz365_shop_auto_next';

const ENDED_PAUSE_MS = 900;  // 播完先停一下（唱臂抬起、看得到 SIDE ENDED）再換下一張
const SKIP_NOTICE_MS = 2000; // 放不出來的唱片，提示顯示多久再換
const MAX_FAILS = 3;         // 連續幾張放不出來就停下來
const STALL_MS = 4000;       // 自動換上去後這麼久還沒開始播，當作被瀏覽器擋下（iPhone 不讓沒點擊就出聲）

const prefersReducedMotion = () => {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

const loadCharacterId = () => {
    try { return localStorage.getItem(CHARACTER_KEY); } catch { return null; }
};

const loadAutoNext = () => {
    try { return localStorage.getItem(AUTO_NEXT_KEY) !== '0'; } catch { return true; }
};

// 清單裡從 date 往前或往後數，第一張有試聽連結的（繞一圈，不算自己）
const playableIndex = (list, date, step) => {
    if (!list) return -1;
    const from = list.findIndex(r => r.date === date);
    for (let i = 1; i < list.length; i++) {
        const idx = ((from < 0 ? 0 : from) + step * i + list.length * i) % list.length;
        if (getYouTubeId(list[idx].youtube)) return idx;
    }
    return -1;
};

const ShopMode = ({
    data, active, interactive, nowPlaying, isVinylSpinning,
    player, playerState, playerError, onTogglePlay,
    onStartPlay, onPlay, onRead, onDeckOpenChange,
}) => {
    const [characterId, setCharacterId] = useState(loadCharacterId);
    const [choosing, setChoosing] = useState(() => !findCharacter(characterId));
    const [open, setOpen] = useState(null); // { crate, records, startIndex }
    const [deck, setDeck] = useState(null); // 唱盤畫面：{ record, placing, take, swapFrom }
    const [queue, setQueue] = useState(null); // 正在播的唱片是從哪一份清單放上去的（上一張／下一張、連續播放照這份）
    const [autoNext, setAutoNext] = useState(loadAutoNext);
    const [chain, setChain] = useState({ date: null, auto: false, fails: 0 }); // 目前這張是不是自動換上來的、前面連續幾張放不出來
    const [stalled, setStalled] = useState(false);
    const [talk, setTalk] = useState(null); // 跟店長說話：{ record, line, quoteLabel, quote }
    const takeRef = useRef(0);
    const crates = useMemo(() => buildCrates(data), [data]);
    const allRecords = useMemo(() => sortNewestFirst(data), [data]);
    const character = findCharacter(characterId);
    const nowDate = nowPlaying?.date ?? null;

    const confirmCharacter = (id) => {
        setCharacterId(id);
        setChoosing(false);
        try { localStorage.setItem(CHARACTER_KEY, id); } catch { /* 記不住就下次再選 */ }
    };

    const openCrate = useCallback((crate) => {
        setOpen({ crate, records: crate.shuffle ? shuffled(crate.records) : crate.records });
    }, []);

    const toggleAutoNext = () => {
        const on = !autoNext;
        setAutoNext(on);
        try { localStorage.setItem(AUTO_NEXT_KEY, on ? '1' : '0'); } catch { /* 記不住就下次再設 */ }
    };

    // 店長這次逛店推薦過什麼：每次走進唱片行重來（第一次說話遞今天的唱片，之後推薦的不重複）
    const talkMemoRef = useRef({ todayDone: false, picked: new Set() });
    useEffect(() => {
        if (!active) talkMemoRef.current = { todayDone: false, picked: new Set() };
    }, [active]);
    const canRecommend = allRecords.some(r => r.editorNote?.trim() || r.albumNotes?.trim());
    const startTalk = useCallback(() => {
        const memo = talkMemoRef.current;
        const today = memo.todayDone ? null : todayRecord(allRecords, formatDateString(new Date()));
        if (today) {
            memo.todayDone = true;
            memo.picked.add(today.date); // 之後的推薦不再遞同一張
            setTalk({ record: today, ...talkFor(today, 'today') });
            return;
        }
        const pick = recommend(allRecords, memo.picked, null);
        if (pick) setTalk({ record: pick, ...talkFor(pick, 'pick') });
    }, [allRecords]);
    const recommendAnother = () => {
        const pick = recommend(allRecords, talkMemoRef.current.picked, talk?.record.date);
        if (pick) setTalk({ record: pick, ...talkFor(pick, 'pick') });
    };

    // 唱盤畫面上就是正在播的唱片時，App 把底部迷你播放器藏起來（控制都在唱盤畫面上）；
    // 在別處換了唱片（例如閱讀這天後換日期）再回來，唱盤上那張已經停了，迷你播放器照常顯示正在播的
    const deckOwnsPlayer = Boolean(deck) && (deck.placing || nowDate === deck.record.date);
    useEffect(() => { onDeckOpenChange?.(deckOwnsPlayer); }, [deckOwnsPlayer, onDeckOpenChange]);

    // 自動換上去之後，過一陣子還沒開始播就在唱盤上放一顆「繼續播放」，讓人點一下接著放
    const playerStateRef = useRef(playerState);
    const playerErrorRef = useRef(playerError);
    const stallTimerRef = useRef(0);
    useEffect(() => {
        playerStateRef.current = playerState;
        playerErrorRef.current = playerError;
    });
    const watchStall = () => {
        clearTimeout(stallTimerRef.current);
        stallTimerRef.current = setTimeout(() => {
            if (![1, 3].includes(playerStateRef.current) && !playerErrorRef.current) setStalled(true);
        }, STALL_MS);
    };
    useEffect(() => () => clearTimeout(stallTimerRef.current), []);

    // 放上唱盤：音樂在點擊當下就開始（iPhone 只允許這時候出聲），
    // 同時切到唱盤畫面播過場；落定（或跳過）後交給 App 換日期、開始播放，畫面停在唱盤上。
    // list：從唱片櫃放的，記下這一櫃；swapFrom：連續播放換下一張時被拿走的舊唱片
    const placeRecord = (record, { list, swapFrom = null, next = null } = {}) => {
        onStartPlay?.(record);
        if (list) setQueue(list);
        setChain(next || { date: record.date, auto: false, fails: 0 });
        setStalled(false);
        if (next) watchStall();
        else clearTimeout(stallTimerRef.current);
        const take = ++takeRef.current;
        if (prefersReducedMotion()) {
            setDeck({ record, placing: false, take, swapFrom: null });
            onPlay(record);
            return;
        }
        setDeck({ record, placing: true, take, swapFrom });
    };
    const finishPlacing = () => {
        if (!deck) return;
        setDeck({ ...deck, placing: false });
        onPlay(deck.record);
    };

    // 換到清單裡的下一張：唱盤畫面開著就演換唱片，回到店裡時只換歌（NOW PLAYING 和迷你播放器跟著更新）
    const advance = ({ failed = false } = {}) => {
        const idx = playableIndex(queue, nowDate, 1);
        if (idx < 0) return;
        const record = queue[idx];
        const next = { date: record.date, auto: true, fails: failed ? chain.fails + 1 : 0 };
        if (deck) {
            placeRecord(record, { swapFrom: deck.record, next });
            return;
        }
        onStartPlay?.(record);
        onPlay(record, { auto: true });
        setChain(next);
        setStalled(false);
        watchStall();
    };
    const advanceRef = useRef(advance);
    useEffect(() => { advanceRef.current = advance; });

    // 正在播的這張是不是從這份清單放上去的（在別處換了唱片就不接著放）
    const inQueue = Boolean(nowDate) && Boolean(queue?.some(r => r.date === nowDate));

    // 播完：在唱片行裡、連續播放開著就換下一張。在店外（閱讀這天、日曆模式）播完的就停著，回到店裡也不會突然換
    const endedAwayRef = useRef(null);
    useEffect(() => {
        if (playerState !== 0) { endedAwayRef.current = null; return; }
        if (!active) { endedAwayRef.current = nowDate; return; }
        if (endedAwayRef.current === nowDate || !autoNext || !inQueue) return;
        const timer = setTimeout(() => advanceRef.current(), ENDED_PAUSE_MS);
        return () => clearTimeout(timer);
    }, [playerState, active, autoNext, inQueue, nowDate]);

    // 自動換上來的唱片放不出來：提示一下再換；連續 MAX_FAILS 張都不行就停下來。自己挑的那張放不出來就停著，看得到串流連結
    const skipping = active && autoNext && inQueue && Boolean(playerError)
        && chain.auto && chain.date === nowDate && chain.fails + 1 < MAX_FAILS;
    useEffect(() => {
        if (!skipping) return;
        const timer = setTimeout(() => advanceRef.current({ failed: true }), SKIP_NOTICE_MS);
        return () => clearTimeout(timer);
    }, [skipping, nowDate]);

    const closeTalk = useCallback(() => setTalk(null), []);

    const togglePlay = () => {
        setStalled(false);
        onTogglePlay();
    };

    // 同一份清單裡可以播的上一張／下一張（沒有試聽連結的跳過）
    const prevIdx = deck ? playableIndex(queue, deck.record.date, -1) : -1;
    const nextIdx = deck ? playableIndex(queue, deck.record.date, 1) : -1;

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
                enabled={interactive && !open && !talk}
                onOpenCrate={openCrate}
                onTalk={startTalk}
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
                    nowPlayingDate={nowDate}
                    onClose={() => setOpen(null)}
                    onPlay={(record) => placeRecord(record, { list: open.records })}
                    onRead={onRead}
                />
            )}
            {/* 店長遞的唱片不屬於哪個唱片櫃：上一張／下一張和連續播放照日期由新往舊 */}
            {talk && (
                <ShopTalk
                    talk={talk}
                    enabled={interactive && !deck}
                    nowPlayingDate={nowDate}
                    canRecommend={canRecommend}
                    onPlay={(record) => { setTalk(null); placeRecord(record, { list: allRecords }); }}
                    onRead={(record) => { setTalk(null); onRead(record); }}
                    onAnother={recommendAnother}
                    onClose={closeTalk}
                />
            )}
            {deck && (
                <ShopDeck
                    character={character}
                    record={deck.record}
                    take={deck.take}
                    placing={deck.placing}
                    swapFrom={deck.swapFrom}
                    enabled={interactive}
                    onPlaced={finishPlacing}
                    onDeck={nowDate === deck.record.date}
                    player={player}
                    playerState={playerState}
                    playerError={playerError}
                    autoNext={autoNext}
                    onToggleAutoNext={toggleAutoNext}
                    skipping={skipping}
                    stalled={stalled}
                    onTogglePlay={togglePlay}
                    onReplay={() => placeRecord(deck.record)}
                    onPrev={prevIdx >= 0 ? () => placeRecord(queue[prevIdx]) : null}
                    onNext={nextIdx >= 0 ? () => placeRecord(queue[nextIdx]) : null}
                    onBack={closeDeck}
                    onRead={() => onRead(deck.record)}
                />
            )}
        </div>
    );
};

export default ShopMode;
