#!/bin/bash
# 自动版本号+1并上传小程序

CLIENT_DIR="/Users/hanyufei/Documents/Git/travel-buddy/client"
PROFILE_JS="$CLIENT_DIR/pages/profile/profile.js"
CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"

# 读取当前版本号（从 profile.js 中提取）
CURRENT=$(grep -o '版本 [0-9]*\.[0-9]*\.[0-9]*' "$PROFILE_JS" | grep -o '[0-9]*\.[0-9]*\.[0-9]*')
if [ -z "$CURRENT" ]; then
  CURRENT="1.0.1"
fi

# 版本号 patch +1
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
PATCH=$((PATCH + 1))
NEW_VERSION="$MAJOR.$MINOR.$PATCH"

echo "📦 当前版本: $CURRENT → 新版本: $NEW_VERSION"

# 更新 profile.js 里的版本号
sed -i '' "s/版本 $CURRENT/版本 $NEW_VERSION/" "$PROFILE_JS"

# 上传
DESC="${1:-版本更新}"
$CLI upload --project "$CLIENT_DIR" -v "$NEW_VERSION" -d "旅行搭子 v$NEW_VERSION - $DESC" 2>&1

if [ $? -eq 0 ]; then
  echo "✅ 上传成功！版本: $NEW_VERSION"
else
  echo "❌ 上传失败，回滚版本号"
  sed -i '' "s/版本 $NEW_VERSION/版本 $CURRENT/" "$PROFILE_JS"
fi
