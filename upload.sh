#!/bin/bash
# 自动上传小程序（优先微信开发者工具 CLI，体验版自动更新）

set -e

CLIENT_DIR="/Users/hanyufei/Documents/Git/travel-buddy/client"
PROFILE_JS="$CLIENT_DIR/pages/profile/profile.js"
KEY_FILE="/Users/hanyufei/Documents/Git/travel-buddy/private.wx6c88b825ea663fa8.key"
APPID="wx6c88b825ea663fa8"
DEVTOOLS_CLI="/Applications/wechatwebdevtools.app/Contents/MacOS/cli"

# 读取当前版本号（从 profile.js 中提取）
CURRENT=$(grep -o '版本 [0-9]*\.[0-9]*\.[0-9]*' "$PROFILE_JS" | grep -o '[0-9]*\.[0-9]*\.[0-9]*')
if [ -z "$CURRENT" ]; then
  CURRENT="1.0.1"
fi

# 版本号由调用方传入，否则自动 patch +1
if [ -n "$1" ]; then
  NEW_VERSION="$1"
else
  IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT"
  PATCH=$((PATCH + 1))
  NEW_VERSION="$MAJOR.$MINOR.$PATCH"
fi

DESC="${2:-版本更新}"

echo "📦 当前版本: $CURRENT → 新版本: $NEW_VERSION"

# 更新 profile.js 里的版本号
sed -i '' "s/版本 $CURRENT/版本 $NEW_VERSION/" "$PROFILE_JS"

DESC_FULL="旅行搭子 v$NEW_VERSION - $DESC"

# ===== 方案一：微信开发者工具 CLI（体验版自动更新）=====
echo "🔄 尝试微信开发者工具 CLI 上传..."
if "$DEVTOOLS_CLI" upload --project "$CLIENT_DIR" -v "$NEW_VERSION" -d "$DESC_FULL" 2>&1; then
  echo "✅ 上传成功（开发者工具）！版本: $NEW_VERSION，体验版已自动更新"
  exit 0
fi

echo "⚠️  开发者工具 CLI 失败，降级使用 miniprogram-ci..."

# ===== 方案二：miniprogram-ci（需手动设体验版）=====
UPLOAD_SCRIPT="/tmp/upload_mp_$$.js"
cat > "$UPLOAD_SCRIPT" << JSEOF
delete global.localStorage;
const ci = require('/opt/homebrew/lib/node_modules/miniprogram-ci');
const path = require('path');
const project = new ci.Project({
  appid: '$APPID',
  type: 'miniProgram',
  projectPath: '$CLIENT_DIR',
  privateKeyPath: '$KEY_FILE',
  ignores: ['node_modules/**/*']
});
ci.upload({
  project,
  version: '$NEW_VERSION',
  desc: '$DESC_FULL',
  setting: { es6: true, minify: true, minifyWXML: true, minifyWXSS: true }
}).then(r => {
  console.log('✅ 上传成功（miniprogram-ci）！版本: $NEW_VERSION');
  console.log('⚠️  注意：需要去公众平台手动将 v$NEW_VERSION 设为体验版');
  process.exit(0);
}).catch(e => {
  console.error('❌ 上传失败:', e.message || e);
  process.exit(1);
});
JSEOF

if node --no-experimental-webstorage "$UPLOAD_SCRIPT" 2>&1; then
  rm -f "$UPLOAD_SCRIPT"
else
  echo "❌ 两种方式均失败，回滚版本号"
  sed -i '' "s/版本 $NEW_VERSION/版本 $CURRENT/" "$PROFILE_JS"
  rm -f "$UPLOAD_SCRIPT"
  exit 1
fi
