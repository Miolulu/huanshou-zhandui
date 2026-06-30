$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "幻兽战队 - 启动本地服务器" -ForegroundColor Cyan

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
  Write-Host "未找到 Python，请先安装 Python 3" -ForegroundColor Red
  exit 1
}

$port = 8888
$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if ($listener) {
  Write-Host "端口 $port 已被占用，尝试直接打开浏览器..." -ForegroundColor Yellow
} else {
  Write-Host "启动 python -m http.server $port ..."
  Start-Process -FilePath "python" -ArgumentList "-m","http.server",$port -WorkingDirectory $root -WindowStyle Normal
  Start-Sleep -Seconds 2
}

$url = "http://127.0.0.1:$port/"
Write-Host "打开 $url"
Start-Process $url
