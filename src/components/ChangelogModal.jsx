// src/components/ChangelogModal.jsx
import { IconX } from './Icons';

export const ChangelogModal = ({ showChangelog, setShowChangelog, changelogData }) => {
    if (!showChangelog) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end lg:items-center justify-start lg:pl-20 pointer-events-none">
            <div className="changelog-panel bg-stone-900/95 backdrop-blur-xl text-stone-300 p-8 w-full lg:w-[400px] h-3/4 lg:h-auto lg:max-h-[600px] shadow-2xl pointer-events-auto border-t lg:border border-amber-900/50 overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                    <h3 className="font-zen font-black text-amber-500 tracking-[0.3em] text-lg uppercase">更新履歷</h3>
                    <button onClick={() => setShowChangelog(false)} className="text-stone-500 hover:text-white transition">
                        <IconX size={24}/>
                    </button>
                </div>
                <div className="space-y-8 font-zen text-sm leading-relaxed">
                    {changelogData.map((log, idx) => (
                        <div key={idx} className={`border-l-2 ${idx === 0 ? 'border-amber-700' : 'border-stone-700 opacity-50'} pl-4`}>
                            <p className={`${idx === 0 ? 'text-amber-600' : ''} font-bold mb-1`}>{log.version} ({log.date})</p>
                            <p className="whitespace-pre-line">{log.content}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};