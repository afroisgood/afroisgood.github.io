// 呼叫 Claude Vision，把一張日曆照片辨識成結構化欄位。

const EXTRACTION_PROMPT = `你正在協助管理一個「每日一張爵士唱片推薦」的部落格後台。
使用者會拍攝一張日曆（通常是日文的爵士唱片桌曆內頁）的照片，
內容包含日期、推薦的專輯／藝人資訊，以及一段日文介紹文字。

請仔細閱讀圖片內容，並「只」輸出以下 JSON（不要有任何額外文字、不要用 markdown code fence 包住，
辨識不出來的欄位請填空字串 ""，不要瞎猜）：

{
  "date": "YYYY-MM-DD 格式的日期；若日曆上只有月日沒有年份，年份留空整個欄位填空字串",
  "artist": "藝人／樂手名稱（保留原文，通常是英文）",
  "song": "曲名，若有標示的話",
  "album": "專輯名稱（保留原文，通常是英文）",
  "quote": "若日曆上有特別標出的一句話引言，逐字抄錄；沒有就留空",
  "content_original": "把日曆上完整的日文介紹文字逐字抄錄下來，保留原本的分段",
  "content_translation_draft": "將 content_original 翻譯成通順的繁體中文，語意需準確；這只是給編輯校對用的草稿"
}`;

const stripCodeFence = (text) => {
    const trimmed = text.trim();
    const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    return fenced ? fenced[1] : trimmed;
};

export const recognizeCalendarPhoto = async (env, { base64, mimeType }) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: env.CLAUDE_MODEL || 'claude-sonnet-5-5',
            max_tokens: 2000,
            messages: [
                {
                    role: 'user',
                    content: [
                        { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
                        { type: 'text', text: EXTRACTION_PROMPT },
                    ],
                },
            ],
        }),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Claude Vision 呼叫失敗（${res.status}）：${errText.slice(0, 300)}`);
    }

    const data = await res.json();
    const rawText = data.content?.find(block => block.type === 'text')?.text || '';

    let parsed;
    try {
        parsed = JSON.parse(stripCodeFence(rawText));
    } catch (_) {
        throw new Error('Claude 回傳的內容不是有效 JSON，請重新拍照或再試一次');
    }

    return {
        date: parsed.date || '',
        artist: parsed.artist || '',
        song: parsed.song || '',
        album: parsed.album || '',
        quote: parsed.quote || '',
        content: [parsed.content_original, parsed.content_translation_draft]
            .filter(Boolean)
            .join('\n\n'),
    };
};
