// 根據樂手、專輯與介紹文字（日文原文＋翻譯），請 Claude 上網查證後寫「專輯資訊補充」草稿。

const buildPrompt = ({ artist, album, content }) => `你正在協助管理一個「每日一張爵士唱片推薦」的部落格後台。
每天的推薦來自一本日文爵士唱片桌曆，編輯會把日文介紹翻成繁體中文，
再另外寫一段「專輯資訊補充」給讀者，解釋介紹文字裡提到、但讀者不一定知道的人物、曲目、典故，
以及這張專輯本身的背景（錄音／發行年份、廠牌、參與樂手、錄音地點等）。

樂手：${artist || '（未提供）'}
專輯：${album || '（未提供）'}
介紹文字（日文原文與中文翻譯）：
${content || '（未提供）'}

請先用網路搜尋查證，再寫補充內容。規則：
- 用繁體中文，語氣跟一般樂評、唱片內頁說明相同，不要太口語，也不要條列式的資料表。
- 分成 2～3 則，每則用「註1：」「註2：」開頭，則與則之間空一行。
  人物註解可寫成「註1：人名 (生年-卒年)」換行後接說明；專輯背景可寫成「註2：《專輯名》與……」這類小標題。
- 人名、專輯名、曲名保留英文原文。
- 只寫查得到可靠來源的事實；查不到或來源互相矛盾的細節（年份、廠牌、樂手名單）就不要寫，絕對不要猜。
- 不要重複介紹文字已經講過的內容，也不要寫評分或購買建議。
- 不要附上網址或參考資料清單。

最後只把補充內容放在 <notes> 與 </notes> 之間輸出，標籤外不要有其他文字。`;

// 伺服器端搜尋跑太久時會先回 pause_turn，把回覆接回去再送一次就會從中斷處繼續
const MAX_CONTINUATIONS = 3;

const callClaude = async (env, messages) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            model: env.CLAUDE_MODEL || 'claude-sonnet-5-5',
            max_tokens: 16000,
            tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }],
            messages,
        }),
    });

    if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Claude 呼叫失敗（${res.status}）：${errText.slice(0, 300)}`);
    }
    return res.json();
};

export const generateAlbumNotes = async (env, { artist, album, content }) => {
    const messages = [{ role: 'user', content: buildPrompt({ artist, album, content }) }];

    let data = await callClaude(env, messages);
    for (let i = 0; data.stop_reason === 'pause_turn' && i < MAX_CONTINUATIONS; i++) {
        messages.push({ role: 'assistant', content: data.content });
        data = await callClaude(env, messages);
    }

    if (data.stop_reason === 'refusal') throw new Error('Claude 拒絕產生這段內容，請手動填寫');

    // 搜尋時回覆會被切成好幾段文字（夾著搜尋結果與引用），全部接起來再取 <notes> 裡的內容
    const text = data.content.filter(block => block.type === 'text').map(block => block.text).join('');
    const notes = text.match(/<notes>([\s\S]*?)<\/notes>/)?.[1].trim();
    if (!notes) throw new Error('沒有產生專輯資訊補充，請再試一次');

    return { albumNotes: notes };
};
