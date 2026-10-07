// src/components/ArticleBody.jsx
// 文章內文：有中文翻譯時，日文原文縮小淡化放在前面當參考，中文為主文；
// 文末註解獨立成區塊，內文的（註N）可點擊跳過去。只有日文或只有中文時照一般主文顯示。
import { Fragment, useMemo } from 'react';
import { parseArticleContent } from '../utils/articleContent';

const REF_PATTERN = /[（(]註\s*(\d+)[）)]/;
const LABEL_CLS = 'font-mono text-[11px] font-bold tracking-[0.25em] uppercase text-[#7a5840]';

export const ArticleBody = ({ content, noteIdPrefix }) => {
    const { paragraphs, notes } = useMemo(() => parseArticleContent(content), [content]);

    const hasTranslation = paragraphs.some(p => p.lang === 'ja') && paragraphs.some(p => p.lang === 'zh');
    const firstTranslationIndex = hasTranslation ? paragraphs.findIndex(p => p.lang === 'zh') : -1;
    const noteNums = new Set(notes.map(n => n.num));
    const noteId = (num) => `note-${noteIdPrefix}-${num}`;

    const scrollToNote = (num) => {
        const el = document.getElementById(noteId(num));
        if (!el) return;
        const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
    };

    // 用 button 而不是 <a href="#…">：網址的 # 已經拿來記日期，改了會被當成換日
    const withNoteRefs = (text) => text.split(new RegExp(REF_PATTERN, 'g')).map((part, i) => {
        if (i % 2 === 0) return part;
        if (!noteNums.has(part)) return `（註${part}）`;
        return (
            <button
                key={i}
                type="button"
                onClick={() => scrollToNote(part)}
                aria-label={`跳到註解 ${part}`}
                className="mx-0.5 align-super font-mono text-[11px] font-bold text-[#7a5840] underline decoration-dotted underline-offset-2 hover:text-stone-900"
            >
                註{part}
            </button>
        );
    });

    return (
        <div className="font-tc text-stone-800">
            {hasTranslation && <p className={`${LABEL_CLS} mb-3`}>原文</p>}

            {paragraphs.map((p, i) => {
                const isOriginal = hasTranslation && p.lang === 'ja';
                return (
                    <Fragment key={i}>
                        {i === firstTranslationIndex && i > 0 && (
                            <hr aria-hidden="true" className="w-16 my-7 border-0 border-t border-stone-900/20" />
                        )}
                        {isOriginal ? (
                            <p className="mb-4 whitespace-pre-line text-[13px] lg:text-sm leading-[1.9] text-stone-600">
                                {p.text}
                            </p>
                        ) : (
                            <p className="mb-5 whitespace-pre-line text-[15px] lg:text-base leading-[1.95]">
                                {withNoteRefs(p.text)}
                            </p>
                        )}
                    </Fragment>
                );
            })}

            {notes.length > 0 && (
                <section aria-label="註解" className="mt-8 pt-5 border-t border-stone-900/15">
                    <h3 className={`${LABEL_CLS} mb-4`}>註解</h3>
                    <ol className="space-y-4">
                        {notes.map((note, i) => (
                            <li
                                key={i}
                                id={noteId(note.num)}
                                tabIndex={-1}
                                className="flex gap-3 -mx-2 px-2 py-1 rounded-sm text-[13px] lg:text-sm leading-[1.85] text-stone-700 outline-none transition-colors duration-500 focus:bg-amber-100/70"
                            >
                                <span className="shrink-0 pt-[3px] font-mono text-[11px] font-bold text-[#7a5840]">註{note.num}</span>
                                <div>
                                    {note.title && <p className="font-bold text-stone-800">{note.title}</p>}
                                    {note.body && <p className="whitespace-pre-line">{note.body}</p>}
                                </div>
                            </li>
                        ))}
                    </ol>
                </section>
            )}
        </div>
    );
};
