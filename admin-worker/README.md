# afroisgood 後台服務

AdminPanel（`#admin`）背後的 Cloudflare Worker，負責：

- **帳號密碼登入**：驗證成功後發一張 12 小時有效的登入憑證。
- **代為讀寫 `public/data/` 裡的資料（每年一個檔案）**：GitHub 金鑰只存在 Worker 裡，前端拿不到。
- **網站流量**：前台每次開啟網站會打一次 `POST /hit`，記進 Cloudflare D1 資料庫 `jazz365-traffic`（綁定名稱 `TRAFFIC_DB`），後台「流量」分頁顯示近 30 天的瀏覽次數與不重複訪客。只存 IP + 瀏覽器資訊的雜湊值，不存原始 IP；機器人、本機測試、在該裝置登入過後台的網站主人都不算。
- **拍照辨識**：呼叫 Claude Vision 辨識日曆照片，再去 YouTube / Spotify 搜尋串流連結。
- **專輯資訊補充草稿**：根據樂手、專輯與內容介紹，讓 Claude 上網查證後寫出「專輯資訊補充」（用同一把 `ANTHROPIC_API_KEY`，網路搜尋每次另計費用）。

所有金鑰都放在這裡，前端完全看不到。

## 部署步驟

1. 安裝依賴並登入 Cloudflare：

   ```bash
   cd admin-worker
   npm install
   npx wrangler login
   ```

2. 設定後台登入用的金鑰（都是互動輸入，不會留在指令紀錄裡）：

   ```bash
   # GitHub 金鑰：建議用 Fine-grained token，只授權 afroisgood.github.io 這個 repo，
   # 權限勾 Contents: Read and write 就夠了
   npx wrangler secret put GITHUB_TOKEN

   # 後台帳號
   npx wrangler secret put ADMIN_USERNAME

   # 後台密碼：先產生雜湊值（輸入時畫面不顯示），再把印出來的那一行貼進去
   npm run hash-password
   npx wrangler secret put ADMIN_PASSWORD_HASH
   ```

   拍照辨識用的金鑰：

   ```bash
   npx wrangler secret put ANTHROPIC_API_KEY
   npx wrangler secret put YOUTUBE_API_KEY
   npx wrangler secret put SPOTIFY_CLIENT_ID
   npx wrangler secret put SPOTIFY_CLIENT_SECRET
   ```

3. 部署：

   ```bash
   npm run deploy
   ```

   流量用的 D1 資料庫不用自己建：第一次部署時 wrangler 會自動建立 `jazz365-traffic`，
   之後的部署會沿用同一個；資料表也會在第一筆瀏覽進來時自動建立。

   部署完成後 wrangler 會印出這支 Worker 的網址，例如：
   `https://afroisgood-admin-worker.<你的子網域>.workers.dev`

4. 回到專案根目錄的 `.env.local`，把這個網址填進去：

   ```
   VITE_ADMIN_WORKER_URL=https://afroisgood-admin-worker.xxx.workers.dev
   ```

   然後重新啟動 `npm run dev`。正式站則是在 GitHub repo 的
   Settings → Secrets and variables → Actions → Variables 設定 `VITE_ADMIN_WORKER_URL`，
   部署流程會自動帶進去。

## 更換密碼或金鑰

- **換密碼**：`npm run hash-password` → `npx wrangler secret put ADMIN_PASSWORD_HASH`。
  登入憑證是用密碼雜湊簽的，換完之後所有裝置的舊登入會自動失效。
- **換 GitHub 金鑰**：`npx wrangler secret put GITHUB_TOKEN` 即可，前台不用重新部署。

## 本機測試

```bash
npm run dev
```

`wrangler dev` 會啟動本機測試伺服器；本機測試時一樣需要先用 `wrangler secret put`
設定過金鑰（或用 `.dev.vars` 檔案，wrangler 支援 dotenv 格式，但**不要把這個檔案
加入 git**）。

## 安全性

- `wrangler.toml` 只放「非機密」設定（允許的前端網域、repo 名稱、模型名稱），
  真正的金鑰一律用 `wrangler secret put` 寫入 Cloudflare，不會出現在任何原始碼或
  git 紀錄裡。
- 密碼只存 PBKDF2-SHA256 雜湊（10 萬次），Worker 本身也不知道原始密碼。
- 同一個 IP 每分鐘最多嘗試登入 5 次（`wrangler.toml` 的 `LOGIN_LIMITER`）。
- `/data`、`/traffic`、`/recognize`、`/album-notes` 都要帶有效的登入憑證才會放行；
  Worker 只開放這幾個固定動作，不能拿來對 GitHub 做其他事。
- 唯一不用登入的是 `/hit`（記一次瀏覽）：只接受 `ALLOWED_ORIGINS` 裡的正式網域，
  同一個 IP 每分鐘最多算 30 次（`wrangler.toml` 的 `HIT_LIMITER`）。
