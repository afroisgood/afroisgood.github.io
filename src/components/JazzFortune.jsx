// src/components/JazzFortune.jsx
import { useState } from 'react';
import { supabase } from '../supabaseClient';

export const JazzFortune = ({ jazzData, onNavigate }) => {
    const [formData, setFormData] = useState({ name: '', date: '', mode: 'astrology' });
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
        if (!formData.date || !formData.name) return alert("請填寫姓名與出生日期。");
        if (!jazzData || Object.keys(jazzData).length === 0) return alert("資料庫準備中，請稍後再試。");
        
        setLoading(true);

        try {
            // 1. 篩選出「有專輯資料」的日期，並隨機抽取一天
            const availableDates = Object.keys(jazzData).filter(key => jazzData[key] && jazzData[key].album);
            const randomDateKey = availableDates[Math.floor(Math.random() * availableDates.length)];
            const randomSong = jazzData[randomDateKey];

            // 2. 呼叫 AI 大腦，傳入這首隨機抽到的歌
            const { data, error } = await supabase.functions.invoke('jazz-fortune-ai', {
                body: { 
                    name: formData.name, 
                    birthDate: formData.date, 
                    mode: formData.mode,
                    currentAlbum: randomSong.album,
                    currentArtist: randomSong.artist
                }
            });

            if (error) throw error;

            // 3. 顯示結果
            setResult({ text: data.ai_text });
            
            // 4. 自動觸發日期跳轉 (將 YYYY-MM-DD 轉回 Date 物件)
            const [y, m, d] = randomDateKey.split('-').map(Number);
            onNavigate(new Date(y, m - 1, d));

        } catch (err) {
            console.error("AI 占卜感應失敗:", err);
            alert("宇宙訊號微弱，請稍後再試。");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-8 pt-6 border-t border-stone-300 font-zen relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#f8f6f2] px-3 py-1 text-[10px] tracking-[0.2em] text-amber-700 font-bold uppercase border border-amber-200 whitespace-nowrap">
                Jazz Fortune
            </div>

            {!result ? (
                <div className="bg-white/60 p-4 shadow-sm border border-stone-200 text-sm">
                    <div className="space-y-3 mb-4">
                        <input 
                            type="text" placeholder="你的姓名" 
                            className="w-full bg-transparent border-b border-stone-300 py-1 text-xs focus:outline-none focus:border-amber-600"
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                        {/* 修正：解決 iOS 手機版不顯示 Placeholder 的問題 */}
                        <input 
                            type="text" 
                            placeholder="選擇出生年月日" 
                            className="w-full bg-transparent border-b border-stone-300 py-1 text-xs focus:outline-none focus:border-amber-600 text-stone-500 cursor-pointer"
                            onFocus={(e) => e.target.type = 'date'}
                            onBlur={(e) => { if (!e.target.value) e.target.type = 'text'; }}
                            onChange={e => setFormData({...formData, date: e.target.value})}
                        />
                    </div>

                    <div className="flex gap-1 mb-4">
                        <button 
                            onClick={() => setFormData({...formData, mode: 'astrology'})}
                            className={`flex-1 py-2 text-[10px] tracking-widest font-bold border transition-all ${formData.mode === 'astrology' ? 'bg-stone-800 text-white' : 'bg-white text-stone-400'}`}
                        >
                            紫微/占星
                        </button>
                        <button 
                            onClick={() => setFormData({...formData, mode: 'humanDesign'})}
                            className={`flex-1 py-2 text-[10px] tracking-widest font-bold border transition-all ${formData.mode === 'humanDesign' ? 'bg-stone-800 text-white' : 'bg-white text-stone-400'}`}
                        >
                            人類圖
                        </button>
                    </div>

                    <button 
                        onClick={handleAnalyze} disabled={loading}
                        className="w-full py-3 bg-amber-700 text-white text-[11px] font-black tracking-widest hover:bg-amber-800 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "感應星象中..." : "抽取今日命定爵士"}
                    </button>
                </div>
            ) : (
                <div className="bg-stone-900 text-stone-100 p-5 shadow-xl page-reveal text-xs">
                    <p className="text-[10px] text-amber-500 tracking-widest mb-3 font-bold uppercase border-b border-amber-500/30 pb-1 inline-block">
                        {formData.name} 的專屬指引
                    </p>
                    <p className="leading-relaxed font-zen italic text-stone-200 mb-4 whitespace-pre-line">
                        {result.text}
                    </p>
                    <button onClick={() => setResult(null)} className="text-[10px] text-stone-500 hover:text-amber-500 tracking-widest transition-colors">
                        ← 重新抽取
                    </button>
                </div>
            )}
        </div>
    );
};