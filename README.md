# ⚽ FIFA 2026 World Cup Player-Level Predictor

這是一個基於 **2026 世界盃各國家隊 26 人大名單（Player-Level）** 進行奪冠預測與賽程模擬的進階專案。

## 💡 專案核心思維
相較於傳統的國家隊整體（Team-level）預測，球員級預測能夠捕捉到更細粒度的資訊：
1. **球員能力聚合**：計算先發陣容與替補陣容的球員評分（PQS）。
2. **傷病與停賽動態模擬**：在蒙地卡羅模擬中加入隨機傷病/停賽事件，當核心球星缺陣時，動態下修球隊戰力期望值。
3. **五大聯賽近況加權**：結合球員在俱樂部的即時數據與身價。

## 📂 資料集放置
請將從 Kaggle 下載的資料集解壓縮並放置於 `data/` 目錄下：
- `road-to-2026-world-cup-squad-prediction` 相關 CSV 檔
- `fifa-world-cup-2026-prediction-system` 相關 CSV 檔
