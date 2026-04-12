#!/bin/bash
# 自动上传小程序（兼容 Node.js v22+，使用 miniprogram-ci）

set -e

CLIENT_DIR="/Users/hanyufei/Documents/Git/travel-buddy/client"
PROFILE_JS="$CLIENT_DIR/pages/profile/profile.js"
KEY_FILE="/Users/hanyufei/Documents/Git/travel-buddy/private.wx6c88b825ea663fa8.key"
APPID="wx6c88b825ea663fa8"

# 读取当前版本号（从 profile.js 中提取）
CURRENT=$(grep -o '版本 [0-9]*\.[0-9]*\.[0-9]*' "$PROFILE_JS" | grep -o '[0-9]*\.[0-9]*\.[0-9]*')
if [ -z "$CURRENT" ]; then
  CURRENT="1.0.1"
fi

# 版本号 patch +1（仅在未指定版本时自增）
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

# 生成上传脚本（Node.js v22+ 兼容，禁用内置 localStorage）
UPLOAD_SCRIPT="/tmp/upload_mp_$$.js"
cat > "$UPLOAD_SCRIPT" << JSEOF
// 修复 Node.js v22+ 内置 localStorage 与 miniprogram-ci 的兼容问题
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
  desc: '旅行搭子 v$NEW_VERSION - $DESC',
  setting: { es6: true, minify: true, minifyWXML: true, minifyWXSS: true },
  onProgressUpdate: (t) => { if (t._msg) process.stdout.write('[进度] ' + t._msg + '\\n'); }
}).then(r => {
  console.log('✅ 上传成功！版本: $NEW_VERSION');
  process.exit(0);
}).catch(e => {
  console.error('❌ 上传失败:', e.message || e);
  process.exit(1);
});
JSEOF

# 使用 --no-experimental-webstorage 禁用 Node.js 内置 localStorage
if node --no-experimental-webstorage "$UPLOAD_SCRIPT" 2>&1; then
  echo "✅ 版本 $NEW_VERSION 已上传到微信后台"
  rm -f "$UPLOAD_SCRIPT"
else
  echo "❌ 上传失败，回滚版本号"
  sed -i '' "s/版本 $NEW_VERSION/版本 $CURRENT/" "$PROFILE_JS"
  rm -f "$UPLOAD_SCRIPT"
  exit 1
fi
