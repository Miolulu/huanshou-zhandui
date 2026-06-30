@echo off
chcp 65001 >nul
cd /d "%~dp0"

echo 正在提交并推送到 GitHub，触发自动部署...
git add -A
git status --short
echo.
set /p MSG=提交说明（直接回车使用默认）: 
if "%MSG%"=="" set MSG=update game
git commit -m "%MSG%" 2>nul
if errorlevel 1 (
  echo 没有新的改动需要提交。
) else (
  git push origin main
  echo.
  echo 已推送！约 1-2 分钟后线上自动更新：
  echo https://miolulu.github.io/huanshou-zhandui/
)
pause
