# 幻兽战队

8 人策略卡牌自动战斗 · 酒馆自走棋 · 元素克制

## 在线游玩

**https://miolulu.github.io/huanshou-zhandui/**

（GitHub Pages 部署，无需本地服务器）

## 本地开发

```powershell
python -m http.server 8888
```

浏览器打开 http://127.0.0.1:8888

## 更新线上版本

修改代码后双击 `deploy.bat`，或执行：

```powershell
git add -A
git commit -m "your message"
git push origin main
```

推送后 GitHub Actions 会自动部署到 Pages（约 1–2 分钟）。
