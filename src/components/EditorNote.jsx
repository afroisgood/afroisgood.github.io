// src/components/EditorNote.jsx
import { StoneEditorIcon } from './Icons';

export const EditorNote = ({ note }) => (
    <div className="editor-note-box bg-[#fffdf9]/95 backdrop-blur-xl border-l-2 border-stone-800 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.15)] relative">
        <div className="flex items-center gap-3 mb-3">
            <StoneEditorIcon />
            <span className="font-zen font-bold text-stone-900 tracking-[0.1em] text-xs">石編的話</span>
        </div>
        <p className="font-zen text-sm lg:text-[0.95rem] leading-relaxed text-stone-800 tracking-wide">{note}</p>
    </div>
);