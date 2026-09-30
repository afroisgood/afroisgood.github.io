// src/utils/articleContent.js
// 把 data.json 的 content 純文字拆成「內文段落」與「註解」。
// 內文段落依假名比例判斷是日文原文還是中文翻譯；註解從第一行「註N：」開始。
// 資料裡的分隔寫法不一（「——」、「— — — —」、沒有分隔、前面多一行「註：」），這裡都要能處理。

const NOTE_HEAD = /^\s*註\s*(\d+)\s*[：:]\s*(.*)$/;
const SEPARATOR = /^[\s—\-─–]*[—\-─–][\s—\-─–]*$/;
const NOTES_LABEL = /^\s*註\s*[：:]?\s*$/;
const KANA = /[぀-ヿ]/g;
const CJK = /[぀-ヿ㐀-鿿]/g;

// 中文翻譯裡偶爾會引用日文曲名，所以用比例判斷而不是「有沒有假名」
const detectLang = (text) => {
    const cjk = (text.match(CJK) || []).length;
    const kana = (text.match(KANA) || []).length;
    return cjk > 0 && kana / cjk > 0.1 ? 'ja' : 'zh';
};

export const parseArticleContent = (content = '') => {
    const lines = content.replace(/\r\n?/g, '\n').split('\n');
    const noteStart = lines.findIndex(line => NOTE_HEAD.test(line));
    const mainLines = noteStart === -1 ? [...lines] : lines.slice(0, noteStart);

    while (mainLines.length) {
        const last = mainLines[mainLines.length - 1];
        if (last.trim() && !SEPARATOR.test(last) && !NOTES_LABEL.test(last)) break;
        mainLines.pop();
    }

    const paragraphs = mainLines
        .join('\n')
        .split(/\n\s*\n/)
        .map(p => p.trim())
        .filter(p => p && !SEPARATOR.test(p))
        .map(text => ({ text, lang: detectLang(text) }));

    const rawNotes = [];
    if (noteStart !== -1) {
        let current = null;
        for (const line of lines.slice(noteStart)) {
            const match = line.match(NOTE_HEAD);
            if (match) {
                current = { num: match[1], head: match[2].trim(), rest: [] };
                rawNotes.push(current);
            } else if (current) {
                current.rest.push(line);
            }
        }
    }

    // 「註1：標題\n說明」→ 有標題；「註1：說明」→ 整行就是說明
    const notes = rawNotes.map(({ num, head, rest }) => {
        const body = rest.join('\n').trim();
        return body ? { num, title: head, body } : { num, title: '', body: head };
    });

    return { paragraphs, notes };
};
