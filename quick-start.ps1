# Travel Buddy Quick Start Script
Write-Host "====================================="
Write-Host "  Travel Buddy Status Check"
Write-Host "====================================="
Write-Host ""

# Check backend
Write-Host "[1/4] Checking backend status..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "    OK Backend is running at http://localhost:3000"
} catch {
    Write-Host "    FAIL Backend not running"
}
Write-Host ""

# Check WeChat DevTools
Write-Host "[2/4] Checking WeChat DevTools..."
$installPath = "C:\Program Files (x86)\Tencent\微信web开发者工具\微信web开发者工具.exe"
if (Test-Path $installPath) {
    Write-Host "    OK WeChat DevTools is installed"
} else {
    Write-Host "    INFO Install from: c:/Users/nierhan/Downloads/wechat_devtools_latest.exe"
}
Write-Host ""

# Check project files
Write-Host "[3/4] Checking project files..."
$clientPath = "c:/Users/nierhan/CodeBuddy/Claw/travel-buddy/client"
$serverPath = "c:/Users/nierhan/CodeBuddy/Claw/travel-buddy/server"

if (Test-Path "$clientPath/app.js") {
    Write-Host "    OK Frontend files ready"
}
if (Test-Path "$serverPath/app.js") {
    Write-Host "    OK Backend files ready"
}
Write-Host ""

# Summary
Write-Host "====================================="
Write-Host "  Summary"
Write-Host "====================================="
Write-Host ""
Write-Host "Project: c:/Users/nierhan/CodeBuddy/Claw/travel-buddy"
Write-Host "Frontend: client/"
Write-Host "Backend: server/"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  1. Install WeChat DevTools"
Write-Host "  2. Import project to WeChat DevTools"
Write-Host "  3. Configure settings (disable URL check)"
Write-Host "  4. Click compile to run"
Write-Host ""
Write-Host "See complete-build-guide.md for details"
Write-Host ""
