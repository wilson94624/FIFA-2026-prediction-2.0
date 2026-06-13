# 🏆 FIFA 2026 World Cup Player-Level Predictor & Simulator

這是一個結合了 **EA Sports FC 26 (FIFA 26) 全球球員級（Player-Level）數據庫**、**雙泊松期望值比分預測模型**，以及 **React 互動式對陣圖動畫網頁** 的進階預測模擬系統。

本專案擺脫了傳統單純依靠國家隊歷史勝負的 Team-Level 預測，改從每支球隊 26 人大名單的球員評分（PQS）與屬性進行底層建構。

---

## 🌟 核心預測演算法說明 (Algorithm Specification)

本專案的模擬邏輯在 Python 蒙地卡羅 10,000 次模擬器與 React 前端網頁中**達成 100% 邏輯同步**，包含以下核心特徵：

### 1. 雙泊松分佈比分預測 (Double Poisson Model)
兩隊對決時的常規時間比分並非直接比較戰力大小，而是根據雙方的 **FIFA ELO 積分**、**先發 11 人戰力值 (Starting PQS)**，以及**當前累積疲勞度**，計算雙方的進球期望值 $\lambda$ (主隊/實力強者) 與 $\mu$ (客隊/挑戰者)：
*   **$\lambda$ (Team A)**:
    $$\lambda = \max\left(0.2, 1.3 + \frac{\text{elo}_A - \text{elo}_B}{450} + \frac{\text{pqs}_A - \text{pqs}_B}{30} + \text{host\_boost}_A - \text{host\_boost}_B \times 0.5\right)$$
*   **$\mu$ (Team B)**:
    $$\mu = \max\left(0.2, 1.1 - \frac{\text{elo}_A - \text{elo}_B}{450} - \frac{\text{pqs}_A - \text{pqs}_B}{30} + \text{host\_boost}_B - \text{host\_boost}_A \times 0.5\right)$$

隨後將期望值帶入泊松分佈進行隨機抽樣，模擬得出具體進球數 $G_A \sim \text{Poisson}(\lambda)$ 與 $G_B \sim \text{Poisson}(\mu)$。此外，系統導入了 **Dixon-Coles 平局修正**，將兩隊同時抽樣到 0 球的機率進行 25% 權重分配（修正為 1:1 或維持 0:0），使平局機率更貼近現實世界。

### 2. 東道主主場優勢 (Host Country Advantage)
2026 世界盃由美、加、墨三國共同舉辦。在對戰中，若其中一方為東道主：
*   東道主進球期望值 $\lambda$ 獲得額外補貼：`+0.10`
*   對手進球期望值 $\mu$ 受到客場壓制：`-0.05`

### 3. 大賽動態疲勞度與板凳深度衰減 (Dynamic Fatigue & Bench Depth)
大賽賽程密集，球員體力會隨每場比賽累積流失：
*   每隊初始疲勞度 $f = 0.0$。
*   每踢完一場比賽，疲勞度累加：
    $$\Delta f = 0.04 \times (1.0 - \text{bench\_pqs}) + (\text{若打延長賽額外 } +0.02)$$
    *板凳深度評分 (`bench_pqs`) 越佳的國家隊，每場累積疲勞的速度越慢。*
*   計算下一場對戰期望時，ELO 與 PQS 會進行乘積折損：
    $$\text{pqs}_{\text{active}} = \text{starting\_pqs} \times (1.0 - f)$$
    $$\text{elo}_{\text{active}} = \text{fifa\_points} \times (1.0 - f \times 0.05)$$

### 4. PK 大戰門將 vs 射手屬性對戰 (GK OVR vs Shooters in Penalty Shootout)
淘汰賽常規與延長賽打平後進入點球大戰，本系統捨棄了 50/50 隨機碰運氣的設計，改由屬性決定勝負：
*   **守門員實力**: 提取先發陣容中 `overall` 最高者作為點球 GK ($GK_{\text{ovr}}$)，若無則預設為 60。
*   **射手平均實力**: 提取除門將外 `overall` 前 5 高的球員平均值 ($Shoot_{\text{ovr}}$)。
*   **罰進機率**（限制在 $[0.55, 0.90]$ 區間內）：
    $$\text{rate}_A = 0.75 + \frac{Shoot_{\text{ovr}, A} - GK_{\text{ovr}, B}}{200}$$
    $$\text{rate}_B = 0.75 + \frac{Shoot_{\text{ovr}, B} - GK_{\text{ovr}, A}}{200}$$

---

## 💡 數據演進與研發心路歷程 (Data Evolution & Rationale)

在專案開發過程中，我們曾經歷了關鍵的數據選取變革：

### 🚫 聯賽真實統計數據的困境
在初期，我們嘗試使用球員在俱樂部聯賽的歷史統計（如賽季進球、助攻、傳球）。但這帶來兩個無法克服的痛點：
1. **中下游國家隊數據殘缺**：如捷克、波赫、維德角等隊伍的球員散落於全球二三線聯賽，面臨嚴重的數據缺失。之前版本迫使我們在小組賽中採用「輪空判負 (0:3)」的生硬邏輯 bypass，破壞了 48 強賽程的完整性。
2. **跨聯盟比較偏誤**：不同國家的球員在完全不同的聯盟與賽制中踢球（如英超 vs 日職聯）。各聯賽的競技強度不同，無法公允地把「日職聯進 15 球的前鋒」與「英超進 10 球的前鋒」放在同一個基準線上對比。

### 💡 轉向官方遊戲數據 (EA Sports FC 26)
為了獲得公允的全球球員基準線，我們改用最新的 **EA Sports FC 26 資料庫**：
*   **標準化全球評級**：EA 擁有龐大的全球球探體系，使用同一套標準（Overall, Attributes）對 18,000+ 球員進行全方位定性與定量評分，提供了唯一可行的**公允基準線**。
*   **解鎖 48 強全陣容**：基於最新的 FC 26 數據，我們完整補齊了 48 支參賽隊伍的所有大名單，**100% 還原真實世界 Wikipedia 抽籤分組**，並完全移除了輪空判負的代碼！

---

## 📂 專案目錄結構

*   `FC26_20250921.csv` - 最新版 EA Sports FC 26 全球球員數據庫 (核心數據)
*   `FIFA_2026_Player_Level_Simulation.ipynb` - Jupyter Notebook 數據分析與 10,000 次模擬入口
*   `src/generate_frontend_data.py` - 前端數據生成器 (解析 CSV 並產生 `teams_db.json`)
*   `src/player_level_simulator.py` - Python 蒙地卡羅 10,000 次模擬器核心
*   `frontend/src/App.jsx` - React 前端核心邏輯與對陣圖 UI 渲染 (已完全中文化)
*   `frontend/src/teams_db.json` - 包含 48 隊 26 人大名單 the JSON 數據庫
*   `archive/` - 用於數據生成器讀取的國家隊 FIFA 積分歷史資料目錄

---

## 🚀 快速開始 (Quick Start)

### 1. 數據與模擬驗證
於根目錄下執行：
```bash
# 1. 重新生成前端所需 JSON 資料庫
python3 src/generate_frontend_data.py

# 2. 執行 Python 10,000 次蒙地卡羅模擬
python3 src/player_level_simulator.py
```

### 2. 啟動 React 前端對陣圖網頁
於 `frontend` 目錄下執行：
```bash
cd frontend
npm install
npm run dev
```
啟動後在瀏覽器開啟 `http://localhost:5173/` 即可體驗高互動性的 2026 世界盃動畫對陣圖與球員大名單面板！
