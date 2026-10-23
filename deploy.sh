#!/bin/bash
# deploy.sh
# 安全部署腳本 — push 前先拉回 GitHub 上的最新版本（後台新增的音樂資料、
# 在 GitHub 上合併的 PR），再把本地的提交接在後面推上去。
# 不使用強制推送：遠端有本地沒有的提交時，絕不覆蓋。

set -e  # 任何指令出錯即中止

if ! git diff --quiet || ! git diff --cached --quiet; then
    echo ""
    echo "⚠️  有尚未提交的變更，請先 git commit 再部署。"
    exit 1
fi

echo ""
echo "📥 拉取 GitHub 上的最新版本..."
if ! git pull --no-rebase --no-edit origin main; then
    echo ""
    echo "⚠️  本地與 GitHub 有衝突，已停止部署。"
    echo "   請解決衝突並 commit 後，再執行一次 bash deploy.sh。"
    exit 1
fi
echo "✓ 已同步 GitHub 最新版本"

echo ""
echo "🚀 推送到 GitHub..."
git push origin main

echo ""
echo "✅ 部署完成！GitHub Actions 將自動重新部署網站。"
echo ""
