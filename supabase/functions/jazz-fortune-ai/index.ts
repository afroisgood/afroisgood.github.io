// supabase/functions/jazz-fortune-ai/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// 【關鍵改變】：直接引入 Google 官方為開發者準備的套件
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // 處理瀏覽器 CORS 預檢
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, birthDate, mode, currentAlbum, currentArtist } = await req.json()
    const apiKey = Deno.env.get('GEMINI_API_KEY')

    if (!apiKey) {
        throw new Error("Supabase 雲端遺失了 GEMINI_API_KEY！");
    }

    // 升級版 AI 提示詞：強制點出星座與人類圖屬性
    const prompt = `
      你是一位精通爵士樂、占星學與人類圖的神秘占卜師。
      讀者姓名：「${name}」
      出生日期：「${birthDate}」
      占卜模式：「${mode === 'humanDesign' ? '人類圖' : '西洋占星'}」
      今日命定專輯：${currentArtist || '未知'} 的《${currentAlbum || '未知'}》

      【執行指令】：
      1. 【精準點題】：請根據他的出生日期（${birthDate}），推算並直接點出他的「${mode === 'humanDesign' ? '人類圖能量類型（如生產者、投射者等）' : '專屬星座（如天蠍座、雙子座等）'}」。文字中「必須」出現他的星座名稱或人類圖類型！
      2. 【運勢與音樂】：結合他的命理能量，寫一段約 80 字的專屬運勢分析，並解釋這張爵士專輯的樂器、節奏或氛圍如何完美接住他今日的靈魂狀態。
      3. 【語氣設定】：優雅、浪漫、帶點爵士吧裡的微醺即興感。
      4. 【絕對規則】：請務必使用「繁體中文（台灣）」撰寫，絕對不可出現日文、簡體字或任何 Markdown 標記符號。
    `

    // 初始化官方 SDK 大腦
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 使用目前最穩定且保證有效的 1.5-flash 模型
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // 呼叫生成內容（SDK 會自動處理背後複雜的網址與格式）
    const result = await model.generateContent(prompt);
    const aiText = result.response.text();

    return new Response(JSON.stringify({ ai_text: aiText }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error("AI 運算錯誤:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})