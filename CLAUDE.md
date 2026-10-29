# JAZZ 365 專案說明

每天一張爵士唱片推薦的網站（React + Vite，部署在 GitHub Pages，對外網域 jazzcalender365.com）。
網站主人使用繁體中文，回覆與 commit 訊息都用繁體中文。

## 更新日誌（每個 PR 都要檢查）

改到讀者看得到的東西時，**在同一個 PR 裡**更新 `public/data/changelog.json`：

- 只寫讀者看得到的變化；後台、admin-worker、部署、重構、文件不寫。
- 版本號：小修正加第三碼（v2.2.0 → v2.2.1），新功能加第二碼（→ v2.3.0），整體改版才加第一碼。
- 日期用臺灣時間的當天；同一天已經有新版本的話，併進那一筆，不要再開新版本。
- 內容每點一行，開頭用「・」，寫法參考現有的條目。
- 陣列由新到舊排序，格式為縮排 2 格、結尾換行（跟後台存檔的格式一致）。
- 後台也能編輯這個檔案，PR 描述裡要提醒網站主人：合併前不要在後台改更新日誌。

## 資料

- `public/data/<年>.json`：每年一個檔案，一筆一天；`public/data/changelog.json`：更新日誌。
- 後台（`#admin`）透過 `admin-worker` 寫入這些檔案，每次存檔會在 `main` 產生「Update jazz data」commit。
- 日文原文與翻譯（`content`）只留在後台，前台不公開。

## 部署

- 推到 `main` 會由 GitHub Actions 自動部署；每天臺灣時間 07:05 也會排程部署一次（產生當天的分享頁）。
- 改到 `admin-worker/` 時，GitHub 不會更新 Cloudflare 上的 Worker，網站主人要在 `admin-worker` 資料夾執行 `npm run deploy`。PR 描述要寫清楚這個步驟。
- 不要強制推送 `main`（`deploy.sh` 已改為先 `git pull` 再一般推送）。

## 檢查

- `npm run build`（會一併產生每日分享頁，以及唱片行唱盤標籤用的像素封面 `dist/cover-px/`；抓不到的封面會略過，不會讓 build 失敗）、`npm run lint`。lint 目前有 13 個原本就存在的問題，新改動不要讓數量增加。
