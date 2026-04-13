@echo off
chcp 65001 >nul
echo ========================================
echo 发布版本 v1.0.39
echo ========================================
echo.
echo 正在准备发布...
echo.

cd /d "c:\Users\nierhan\CodeBuddy\Claw\travel-buddy"

echo [1/4] 检查版本号...
powershell -Command "$version = (Get-Content server\package.json | ConvertFrom-Json).version; Write-Host 版本号: $version"

echo.
echo [2/4] 添加文件到 Git...
git add -A
if %errorlevel% neq 0 (
    echo Git添加文件失败
    pause
    exit /b 1
)

echo.
echo [3/4] 提交代码...
git commit -m "v1.0.39 恢复云开发配置，修复项目导入问题"
if %errorlevel% neq 0 (
    echo Git提交失败
    pause
    exit /b 1
)

echo.
echo [4/4] 推送到远程仓库...
git push origin master
if %errorlevel% neq 0 (
    echo Git推送失败
    pause
    exit /b 1
)

echo.
echo ========================================
echo 版本 v1.0.39 已成功提交！
echo ========================================
echo.
echo 下一步：
echo 1. 在微信开发者工具中点击"上传"按钮
echo 2. 填写版本号：1.0.39
echo 3. 填写备注：恢复云开发配置，修复项目导入问题
echo 4. 登录微信公众平台提交审核
echo.
pause
