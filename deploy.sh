#!/bin/bash
# deploy.sh
# 安全部署腳本 — 每次 push 前先從 GitHub 拉回最新 data.json，
# 避免後台新增的音樂資料被本地舊版本覆蓋。

set -e  # 任何指令出錯即中止

echo ""
echo "📥 拉取 GitHub 上最新的 data.json..."
git fetch origin main
git checkout origin/main -- public/data.json
echo "✓ data.json 已同步為 GitHub 最新版本"

echo ""
echo "📦 將 data.json 加入本次提交..."
git add public/data.json

# 若有其他尚未提交的變更也一起打包
if ! git diff --cached --quiet; then
    git commit -m "sync: merge latest data.json from remote before deploy" --no-edit 2>/dev/null || true
fi

echo ""
echo "🚀 推送到 GitHub..."
git push origin main --force

echo ""
echo "✅ 部署完成！GitHub Actions 將自動重新部署網站。"
echo ""
