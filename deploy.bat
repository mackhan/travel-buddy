@echo off
chcp 65001 >nul
echo ============================================
echo   旅行搭子 - 一键部署脚本 v1.0.41
echo ============================================
echo.

echo [1/4] 登录微信云托管 CLI...
call wxcloud login --appId wx6c88b825ea663fa8
if %ERRORLEVEL% neq 0 (
    echo 登录失败！请重试。
    pause
    exit /b 1
)
echo ✓ 登录成功
echo.

echo [2/4] 部署后端到云托管...
call wxcloud run:deploy "%~dp0server" --envId prod-1gs49bco623f3144 --serviceName express-37pl --containerPort 3000 --releaseType FULL --remark "v1.0.41 详情页增加取消申请按钮、完善mock数据" --noConfirm --detach
if %ERRORLEVEL% neq 0 (
    echo 部署失败！请检查错误信息。
    pause
    exit /b 1
)
echo ✓ 后端部署成功
echo.

echo [3/4] 上传前端小程序...
call "C:\Program Files (x86)\Tencent\微信web开发者工具\cli.bat" upload --project "%~dp0client" --version "1.0.41" --desc "v1.0.41 详情页增加取消申请按钮、完善mock数据支持"
if %ERRORLEVEL% neq 0 (
    echo 上传失败！请检查错误信息。
    pause
    exit /b 1
)
echo ✓ 前端上传成功
echo.

echo [4/4] 部署完成！
echo.
echo ============================================
echo   部署完成！
echo ============================================
echo.
echo 后续步骤：
echo   1. 登录 https://mp.weixin.qq.com
echo   2. 进入"版本管理"
echo   3. 找到版本 1.0.41，点击"提交审核"
echo.
pause
