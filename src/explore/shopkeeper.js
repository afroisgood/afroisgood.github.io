// 跟店長說話：店長的台詞和推薦唱片的規則都在這裡，要改台詞改這個檔就好。
// 每次走進唱片行，第一次說話遞今天的唱片；之後「再推薦一張」從有石編的話或專輯補充的唱片裡挑，這次逛店期間不重複。
import { getYouTubeId } from './crates';

const LINES = {
    // 遞今天的唱片
    today: [
        '今天這張剛到，先聽這個。',
        '來得正好，今天這張我剛拆封。',
        '先別急著翻，今天這張要先聽。',
    ],
    // 今天的唱片沒有試聽連結
    todayNoListen: [
        '今天這張店裡沒辦法試聽，先看看文章怎麼寫。',
    ],
    // 推薦一張（接著引用石編的話或專輯補充）
    pick: [
        '這張我很常放。',
        '要不要試試這張？',
        '這張放下去，店裡的空氣會變。',
        '這張客人常問，你也聽聽。',
    ],
    // 引用的開頭
    quoteNote: '石編是這麼說的：',
    quoteAlbum: '這張有點故事：',
};

const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

/** 店長這次要說的話：{ line, quoteLabel, quote } */
export const talkFor = (record, kind) => {
    const note = record.editorNote?.trim();
    const albumNote = record.albumNotes?.trim();
    const canListen = Boolean(getYouTubeId(record.youtube));
    const line = kind === 'today'
        ? pickOne(canListen ? LINES.today : LINES.todayNoListen)
        : pickOne(LINES.pick);
    if (note) return { line, quoteLabel: LINES.quoteNote, quote: note };
    if (albumNote) return { line, quoteLabel: LINES.quoteAlbum, quote: albumNote };
    return { line, quoteLabel: null, quote: null };
};

/** 今天的唱片；今天還沒上架就給最新的一張。records 由新到舊 */
export const todayRecord = (records, todayKey) => records.find(r => r.date === todayKey) || records[0] || null;

/** 從有石編的話或專輯補充的唱片裡挑一張沒推薦過的；都推薦過就重來一輪。picked 是這次逛店已經推薦過的日期 */
export const recommend = (records, picked, exclude) => {
    const pool = records.filter(r => (r.editorNote?.trim() || r.albumNotes?.trim()) && r.date !== exclude);
    if (pool.length === 0) return null;
    let remaining = pool.filter(r => !picked.has(r.date));
    if (remaining.length === 0) {
        picked.clear();
        remaining = pool;
    }
    const record = pickOne(remaining);
    picked.add(record.date);
    return record;
};
