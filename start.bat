@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo ========================================
echo   幻兽战队 - 本地服务器
echo ========================================
echo.

where python >nul 2>&1
if errorlevel 1 (
  echo [错误] 未找到 Python，请先安装 Python 3 并加入 PATH
  echo 下载: https://www.python.org/downloads/
  pause
  exit /b 1
)

echo [1/2] 正在启动 HTTP 服务 (端口 8888)...
start "幻兽战队-服务器" cmd /k "cd /d "%~dp0" && python -m http.server 8888"

echo [2/2] 等待服务就绪...
timeout /t 2 /nobreak >nul

echo 正在打开浏览器: http://127.0.0.1:8888
start "" "http://127.0.0.1:8888"

echo.
echo 服务器已在独立窗口运行，关闭该窗口即可停止服务。
echo 若页面仍无法打开，请确认防火墙未拦截 Python。
pause
