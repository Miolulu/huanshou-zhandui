@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo 正在提交并推送到 GitHub，自动更新线上版本...
git add -A
git status --short
echo.
set /p MSG=提交说明（直接回车使用默认）: 
if "%MSG%"=="" set MSG=update game
git -c user.name="Miolulu" -c user.email="283957080@users.noreply.github.com" commit -m "%MSG%" 2>nul
if errorlevel 1 (
  echo 没有新的改动需要提交。
) else (
  git push origin main
  echo.
  echo 已推送！约 1 分钟后线上自动更新：
  echo https://miolulu.github.io/huanshou-zhandui/
)
pause
