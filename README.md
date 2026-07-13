# MBTI 像素人格檢測所

一個可直接部署到 GitHub Pages 的繁體中文 MBTI 風格自我探索測驗。

## 功能

- 24 道題目，四個向度各 6 題
- 16 種人格結果與原創像素角色
- 手機與桌面自適應介面
- 四向度百分比顯示
- 像素小隊推薦
- 結果卡 PNG 下載
- Web Share API／剪貼簿分享
- 不依賴框架或外部圖片資源

## 本機開啟

直接開啟 `index.html` 即可，或執行：

```bash
python -m http.server 8000
```

再瀏覽 `http://localhost:8000`。

## GitHub Pages

儲存庫已包含 GitHub Pages Actions 工作流程。若尚未啟用 Pages，請到：

`Settings → Pages → Build and deployment → Source → GitHub Actions`

部署完成後，網站網址會是：

`https://xieyaozhong.github.io/MBTI/`

## 說明

本專案以 MBTI 四向度概念設計，僅供娛樂與自我探索，不是心理診斷工具。16 款像素人物、介面與結果文字皆為本專案原創，沒有直接使用網路流傳的既有角色圖。
