// src/components/SongRating.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // 引入你剛設定好的連線檔案
import { IconStar } from './Icons';

export const SongRating = ({ dateKey }) => {
    const [myRating, setMyRating] = useState(0);      // 使用者自己的評分 (暫存於本地)
    const [average, setAverage] = useState(0);        // 全球平均分數
    const [totalVotes, setTotalVotes] = useState(0);  // 總評價人數
    const [hover, setHover] = useState(0);            // 滑鼠懸停時的星星數
    const [loading, setLoading] = useState(true);

    // 1. 從 Supabase 雲端抓取這首歌的「平均分」與「總人數」
    const fetchGlobalRatings = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('song_ratings')
                .select('rating')
                .eq('date_key', dateKey);

            if (error) throw error;

            if (data && data.length > 0) {
                const sum = data.reduce((acc, curr) => acc + curr.rating, 0);
                setAverage((sum / data.length).toFixed(1)); // 取到小數點第一位
                setTotalVotes(data.length);
            } else {
                setAverage(0);
                setTotalVotes(0);
            }
        } catch (error) {
            console.error('抓取評分出錯:', error.message);
        } finally {
            setLoading(false);
        }
    };

    // 當日期切換時，重新抓取該日期的資料
    useEffect(() => {
        fetchGlobalRatings();
        // 從本地讀取使用者是否曾評分過這首歌
        const saved = localStorage.getItem(`my-rating-${dateKey}`);
        setMyRating(saved ? parseInt(saved) : 0);
    }, [dateKey]);

    // 2. 當使用者點擊星星，將評分送上雲端
    const handleRating = async (val) => {
        setMyRating(val);
        localStorage.setItem(`my-rating-${dateKey}`, val);

        const { error } = await supabase
            .from('song_ratings')
            .insert([{ date_key: dateKey, rating: val }]);

        if (error) {
            alert('評分失敗，請確認 Supabase 的 RLS 權限已開啟');
            console.error(error);
        } else {
            // 成功後立即重新抓取，更新畫面上的平均分與人數
            fetchGlobalRatings();
        }
    };

    return (
        <div className="mt-12 pt-8 border-t border-stone-200/60">
            <div className="flex justify-between items-end mb-4">
                <p className="font-zen text-[10px] tracking-[0.3em] text-stone-400 uppercase font-bold">
                    Global Feedback
                </p>
                {!loading && totalVotes > 0 && (
                    <span className="font-zen text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded">
                        平均 {average} ★ (共 {totalVotes} 人評價)
                    </span>
                )}
            </div>
            
            <div className="flex flex-col gap-3">
                <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                        <button
                            key={num}
                            onMouseEnter={() => setHover(num)}
                            onMouseLeave={() => setHover(0)}
                            onClick={() => handleRating(num)}
                            className="transition-all duration-300 hover:scale-110 active:scale-90"
                        >
                            <IconStar 
                                size={22} 
                                className={num <= (hover || myRating) ? "text-amber-600" : "text-stone-300"}
                                fill={num <= (hover || myRating) ? "currentColor" : "none"}
                            />
                        </button>
                    ))}
                </div>
                <p className="font-zen text-xs text-stone-500 tracking-widest min-h-[1.25rem]">
                    {hover ? `給予 ${hover} 星評價` : myRating ? "感謝你的參與" : "分享你的聽感"}
                </p>
            </div>
        </div>
    );
};