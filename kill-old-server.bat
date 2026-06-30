@echo off
chcp 65001 >nul
echo 正在清理占用 8767 端口的旧进程（如有）...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":8767.*LISTENING"') do (
  echo 结束 PID %%a
  taskkill /F /PID %%a >nul 2>&1
)
echo 完成。请重新运行 start.bat
