# afroisgood 後台 — 拍照辨識代理服務

給 AdminPanel「拍照辨識並自動填表」功能用的 Cloudflare Worker。
負責呼叫 Claude Vision 辨識日曆照片，再用辨識結果去 YouTube / Apple Music / Spotify
搜尋最相關的串流連結，整理成一筆 entry 資料回傳給前端。所有金鑰都放在這裡，
前端完全看不到。

## 部署步驟

1. 安裝依賴並登入 Cloudflare：

   ```bash
   cd admin-worker
   npm install
   npx wrangler login
   ```

2. 設定金鑰（都是互動輸入，不會留在指令紀錄裡）：

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

   部署完成後 wrangler 會印出這支 Worker 的網址，例如：
   `https://afroisgood-admin-worker.<你的子網域>.workers.dev`

4. 回到專案根目錄的 `.env.local`，把這個網址填進去：

   ```
   VITE_ADMIN_WORKER_URL=https://afroisgood-admin-worker.xxx.workers.dev
   ```

   然後重新啟動 `npm run dev`（或重新 build 部署前台）。

## 本機測試

```bash
npm run dev
```

`wrangler dev` 會啟動本機測試伺服器；本機測試時一樣需要先用 `wrangler secret put`
設定過金鑰（或用 `.dev.vars` 檔案，wrangler 支援 dotenv 格式，但**不要把這個檔案
加入 git**）。

## 安全性

- `wrangler.toml` 只放「非機密」設定（允許的前端網域、GitHub 帳號、模型名稱），
  真正的金鑰一律用 `wrangler secret put` 寫入 Cloudflare，不會出現在任何原始碼或
  git 紀錄裡。
- 每次呼叫 `/recognize` 前，Worker 會先用呼叫端帶來的 GitHub token 反查
  `GET /user`，確認 `login` 等於 `wrangler.toml` 裡的 `GITHUB_OWNER`，才會放行 ——
  也就是只有登入後台（輸入過有效 GitHub token）的你本人才能觸發這支會花錢的端點。
