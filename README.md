# 日めくりジャズ365 | 2026年版

每天一張爵士唱片推薦，365 天不間斷。
Daily Jazz Almanac 2026 — a retro-flavored web almanac for jazz lovers.

🔗 **[afroisgood.github.io](https://afroisgood.github.io)**

---

## 功能特色

- **日曆導覽** — 以月曆形式瀏覽全年 365 天的推薦唱片
- **沉浸式聆聽模式** — 全螢幕黑膠播放介面，整合 YouTube 播放器
- **動態封面背景** — 依當日專輯封面自動生成模糊光暈背景
- **3D 翻頁動畫** — CSS perspective 翻頁效果，呼應日めくり（日曆撕頁）概念
- **鍵盤快捷鍵** — `← →` 切換日期、`I` 進入沉浸模式、`Space` 播放暫停、`Esc` 退出
- **隨機探索** — 一鍵隨機跳轉至任一有資料的日期
- **行動版最佳化** — 底部抽屜式日曆、迷你播放控制列
- **後台管理介面** — 內建 Admin Panel 管理音樂資料（`#admin`）

---

## 技術架構

| 項目 | 版本 |
|------|------|
| React | 19 |
| Vite | 6 |
| Tailwind CSS | 4 |
| 部署 | GitHub Pages + GitHub Actions |

資料來源：`public/data.json`（單一 JSON 檔，支援 `entries` + `changelog` 結構）

---

## 本地開發

```bash
npm install
npm run dev
```

## 部署

```bash
npm run build
git add .
git commit -m "你的更新說明"
bash deploy.sh
```

> `deploy.sh` 會先從遠端拉取最新的 `data.json` 再推送，避免後台資料被本地版本覆蓋。

---

## 專案結構

```
scripts/
└── getSpotifyInfo.js        # 依據 public/data.json 的 artist、album 補齊 Spotify 連結，輸出為 public/replaced-spotify.json

src/
├── App.jsx                 # 主程式、狀態管理、鍵盤快捷鍵
├── components/
│   ├── DailyArticle.jsx    # 每日推薦文章主體
│   ├── Sidebar.jsx         # 桌面版月曆側欄
│   ├── MobileNav.jsx       # 行動版底部導覽列 + 日曆抽屜
│   ├── ImmersiveMode.jsx   # 沉浸式聆聽模式
│   ├── RetroMenuBar.jsx    # 頂部復古選單列
│   ├── AdminPanel.jsx      # 後台資料管理
│   └── ...
├── hooks/
│   └── useYouTubePlayer.js # YouTube IFrame API 封裝
└── index.css               # 全域樣式、動畫定義
public/
└── data.json               # 所有音樂資料與更新日誌
```

## 更新 Spotify 資料

先在 [`.env`](.env) 設定 Spotify API 憑證：

```env
Client_ID=你的 Spotify Client ID
CLIENT_SECRET=你的 Spotify Client Secret
```

`Client_ID` 與 `CLIENT_SECRET` 可參考 Spotify 官方文件申請：

- <https://developer.spotify.com/documentation/web-api/concepts/apps>
- <https://developer.spotify.com/documentation/web-api/reference/search>

執行以下指令即可更新 Spotify 連結資料：

```bash
node script/getSpotifyInfo.js
```

或是在 [`package.json`](package.json) 加入腳本後使用：

```json
{
  "scripts": {
    "update-spotify": "node script/getSpotifyInfo.js"
  }
}
```

接著即可透過以下指令執行：

```bash
npm run update-spotify
```

執行結果說明：

- 讀取 [`public/data.json`](public/data.json)
- 若某筆資料已有 `spotify` 欄位，則略過查詢，避免重複請求
- 若缺少 `spotify`，則以 `artist` 與 `album` 向 Spotify Search API 查詢
- 每筆請求之間固定等待 2 秒
- 最終輸出為 [`public/replaced-spotify.json`](public/replaced-spotify.json)，不會直接覆寫 [`public/data.json`](public/data.json)

---

*JAZZ，是一種帶著焦臭味撲面而來的文字。— 平岡正明*
