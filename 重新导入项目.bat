@echo off
chcp 65001 >nul
echo ========================================
echo 微信开发者工具设置指南
echo ========================================
echo.
echo 请按照以下步骤操作：
echo.
echo 1. 开启 CLI 服务端口
echo    - 打开微信开发者工具
echo    - 点击 设置 → 通用设置 → 安全设置
echo    - 勾选 "开启服务端口"
echo    - 点击"确定"
echo.
echo 2. 重新导入项目
echo    - 关闭当前项目
echo    - 点击 "+" 号
echo    - 选择目录：c:\Users\nierhan\CodeBuddy\Claw\travel-buddy\client
echo    - AppID 选择：测试号（不要输入 touristappid）
echo    - 项目名称：Travel Buddy
echo    - 点击"导入"
echo.
echo 3. 配置本地设置
echo    - 点击 "详情" 按钮
echo    - 切换到 "本地设置" 标签
echo    - 勾选：
echo      ✅ 不校验合法域名
echo      ✅ 启用 ES6 转 ES5
echo      ✅ 增强编译
echo    - 点击"确定"
echo.
echo 4. 编译运行
echo    - 点击 "编译" 按钮
echo    - 等待编译完成
echo.
echo ========================================
echo 按任意键打开微信开发者工具...
pause >nul

start "" "C:\Program Files (x86)\Tencent\微信web开发者工具\微信开发者工具.exe"

echo.
echo 已启动微信开发者工具，请按照上述步骤操作！
pause
