import os
import json
import numpy as np
import pandas as pd
import time

# 設定路徑
BASE_DIR = "/Users/wilson/Desktop/FIFA_Player_Level"
DATA_PATH = os.path.join(BASE_DIR, "frontend/src/teams_db.json")

def load_teams():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def play_match(team_a, team_b, teams, fatigue, is_knockout=False):
    tA = teams[team_a]
    tB = teams[team_b]
    
    # 處理無大名單國家的輪空判負 (0:3) 邏輯
    if not tA['has_data'] or not tB['has_data']:
        if not tA['has_data'] and not tB['has_data']:
            return team_a if is_knockout else 'DRAW', 0, 0
        if not tA['has_data']:
            return team_b, 0, 3
        if not tB['has_data']:
            return team_a, 3, 0

    # 讀取當前疲勞值
    fA = fatigue.get(team_a, 0.0)
    fB = fatigue.get(team_b, 0.0)

    # 正常球員級雙卜瓦松預測 (加入疲勞扣減)
    eloA = tA['fifa_points'] * (1.0 - fA * 0.05)
    eloB = tB['fifa_points'] * (1.0 - fB * 0.05)
    
    pqsA = tA['starting_pqs'] * (1.0 - fA)
    pqsB = tB['starting_pqs'] * (1.0 - fB)
    
    # 東道主優勢 (美、加、墨)
    host_hosts = {"USA", "Mexico", "Canada"}
    host_boost_a = 0.10 if team_a in host_hosts else 0.0
    host_boost_b = 0.10 if team_b in host_hosts else 0.0
    
    # 計算進球期望值
    lambda_val = max(0.2, 1.3 + (eloA - eloB) / 450 + (pqsA - pqsB) / 30 + host_boost_a - host_boost_b * 0.5)
    mu_val = max(0.2, 1.1 - (eloA - eloB) / 450 - (pqsA - pqsB) / 30 + host_boost_b - host_boost_a * 0.5)
    
    # Poisson 隨機抽樣進球數
    goalsA = np.random.poisson(lambda_val)
    goalsB = np.random.poisson(mu_val)
    
    # Dixon-Coles 低比分平局修正
    if goalsA == 0 and goalsB == 0 and np.random.rand() < 0.25:
        if np.random.rand() > 0.5:
            goalsA = 1
            goalsB = 1
            
    winner = 'DRAW'
    extra_time_played = False

    if goalsA > goalsB:
        winner = team_a
    elif goalsB > goalsA:
        winner = team_b
    else:
        if is_knockout:
            # 延長賽 (30分鐘)
            extra_time_played = True
            extra_a = np.random.poisson(lambda_val * 0.33)
            extra_b = np.random.poisson(mu_val * 0.33)
            goalsA += extra_a
            goalsB += extra_b
            
            if goalsA > goalsB:
                winner = team_a
            elif goalsB > goalsA:
                winner = team_b
            else:
                # 點球大戰 (PK) - 門將最高 rating 對決雙方射手平均 rating
                gk_a = max([p['overall'] for p in tA['players'] if p['position'] == 'GK'] or [60])
                gk_b = max([p['overall'] for p in tB['players'] if p['position'] == 'GK'] or [60])
                
                shooters_a = np.mean(sorted([p['overall'] for p in tA['players'] if p['position'] != 'GK'], reverse=True)[:5] or [65])
                shooters_b = np.mean(sorted([p['overall'] for p in tB['players'] if p['position'] != 'GK'], reverse=True)[:5] or [65])
                
                # 計算點球罰進率
                rate_a = max(0.55, min(0.90, 0.75 + (shooters_a - gk_b) / 200.0))
                rate_b = max(0.55, min(0.90, 0.75 + (shooters_b - gk_a) / 200.0))
                
                pen_a, pen_b = 0, 0
                for _ in range(5):
                    if np.random.rand() < rate_a: pen_a += 1
                    if np.random.rand() < rate_b: pen_b += 1
                while pen_a == pen_b:
                    if np.random.rand() < rate_a: pen_a += 1
                    if np.random.rand() < rate_b: pen_b += 1
                
                winner = team_a if pen_a > pen_b else team_b

    # 累加疲勞值 (板凳深度 bench_pqs 越高，累積疲勞越慢)
    benchA = tA['bench_pqs'] if tA['has_data'] else 0.2
    benchB = tB['bench_pqs'] if tB['has_data'] else 0.2
    fatigue[team_a] = fA + 0.04 * (1.0 - benchA) + (0.02 if extra_time_played else 0.0)
    fatigue[team_b] = fB + 0.04 * (1.0 - benchB) + (0.02 if extra_time_played else 0.0)

    return winner, goalsA, goalsB

def simulate_group_stage(teams, fatigue):
    standings = {}
    for team in teams.keys():
        standings[team] = {
            'team': team,
            'points': 0,
            'gd': 0,
            'gs': 0,
            'elo': teams[team]['fifa_points']
        }
        
    groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
    
    for grp in groups:
        grp_teams = [t for t in teams.keys() if teams[t]['group'] == grp]
        
        # 循環賽
        for i in range(len(grp_teams)):
            for j in range(i + 1, len(grp_teams)):
                team_a = grp_teams[i]
                team_b = grp_teams[j]
                
                winner, gA, gB = play_match(team_a, team_b, teams, fatigue, is_knockout=False)
                
                standings[team_a]['gs'] += gA
                standings[team_a]['gd'] += (gA - gB)
                standings[team_b]['gs'] += gB
                standings[team_b]['gd'] += (gB - gA)
                
                if winner == team_a:
                    standings[team_a]['points'] += 3
                elif winner == team_b:
                    standings[team_b]['points'] += 3
                else:
                    standings[team_a]['points'] += 1
                    standings[team_b]['points'] += 1
                    
    # 小組名次排序
    group_results = {}
    for grp in groups:
        grp_teams = [t for t in teams.keys() if teams[t]['group'] == grp]
        sorted_grp = sorted(
            [standings[t] for t in grp_teams],
            key=lambda x: (x['points'], x['gd'], x['gs'], x['elo']),
            reverse=True
        )
        group_results[grp] = sorted_grp
        
    qualified_1st_2nd = []
    qualified_3rds = []
    
    for grp in groups:
        qualified_1st_2nd.append(group_results[grp][0]['team'])
        qualified_1st_2nd.append(group_results[grp][1]['team'])
        qualified_3rds.append(group_results[grp][2])
        
    # 篩選前 8 個最好的第三名
    sorted_thirds = sorted(
        qualified_3rds,
        key=lambda x: (x['points'], x['gd'], x['gs'], x['elo']),
        reverse=True
    )
    
    qualified_thirds_teams = [x['team'] for x in sorted_thirds[:8]]
    return qualified_1st_2nd + qualified_thirds_teams

def simulate_tournament_once(teams):
    fatigue = {t: 0.0 for t in teams.keys()}
    
    # 1. 小組賽
    qualified32 = simulate_group_stage(teams, fatigue)
    
    # 2. 32強對陣 (依 Elo 進行交叉排序對決，同前端設定)
    sorted32 = sorted(qualified32, key=lambda x: teams[x]['fifa_points'], reverse=True)
    
    r32_winners = []
    for i in range(16):
        winner, _, _ = play_match(sorted32[i], sorted32[31 - i], teams, fatigue, is_knockout=True)
        r32_winners.append(winner)
        
    # 3. 16強
    r16_winners = []
    for i in range(8):
        winner, _, _ = play_match(r32_winners[i * 2], r32_winners[i * 2 + 1], teams, fatigue, is_knockout=True)
        r16_winners.append(winner)
        
    # 4. 八強
    qf_winners = []
    for i in range(4):
        winner, _, _ = play_match(r16_winners[i * 2], r16_winners[i * 2 + 1], teams, fatigue, is_knockout=True)
        qf_winners.append(winner)
        
    # 5. 四強
    sf_winners = []
    for i in range(2):
        winner, _, _ = play_match(qf_winners[i * 2], qf_winners[i * 2 + 1], teams, fatigue, is_knockout=True)
        sf_winners.append(winner)
        
    # 6. 決賽
    champion, _, _ = play_match(sf_winners[0], sf_winners[1], teams, fatigue, is_knockout=True)
    
    return {
        'R32': qualified32,
        'R16': r32_winners,
        'QF': r16_winners,
        'SF': qf_winners,
        'Final': sf_winners,
        'Winner': champion
    }

def run_monte_carlo(n_simulations=10000):
    teams = load_teams()
    
    # 初始化統計字典
    stats = {}
    for team in teams.keys():
        stats[team] = {
            'R32_pct': 0.0,
            'R16_pct': 0.0,
            'QF_pct': 0.0,
            'SF_pct': 0.0,
            'Final_pct': 0.0,
            'Winner_pct': 0.0
        }
        
    print(f"開始執行球員級蒙地卡羅模擬 ({n_simulations} 次)...")
    start_time = time.time()
    
    for _ in range(n_simulations):
        run = simulate_tournament_once(teams)
        
        for team in run['R32']:
            stats[team]['R32_pct'] += 1
        for team in run['R16']:
            stats[team]['R16_pct'] += 1
        for team in run['QF']:
            stats[team]['QF_pct'] += 1
        for team in run['SF']:
            stats[team]['SF_pct'] += 1
        for team in run['Final']:
            stats[team]['Final_pct'] += 1
        stats[run['Winner']]['Winner_pct'] += 1
        
    # 計算百分比
    for team in stats.keys():
        for stage in stats[team].keys():
            stats[team][stage] = (stats[team][stage] / n_simulations) * 100
            
    df_stats = pd.DataFrame.from_dict(stats, orient='index')
    df_stats = df_stats.sort_values(by='Winner_pct', ascending=False)
    
    # 輸出前 15 強
    print("\n球員級模擬 - 奪冠機率前 15 名：")
    print(df_stats.head(15).to_string(formatters={
        'R32_pct': '{:,.2f}%'.format,
        'R16_pct': '{:,.2f}%'.format,
        'QF_pct': '{:,.2f}%'.format,
        'SF_pct': '{:,.2f}%'.format,
        'Final_pct': '{:,.2f}%'.format,
        'Winner_pct': '{:,.2f}%'.format
    }))
    
    # 儲存結果
    out_dir = os.path.join(BASE_DIR, "src")
    if not os.path.exists(out_dir):
        os.makedirs(out_dir)
    df_stats.to_csv(os.path.join(out_dir, "simulation_results_player_level.csv"))
    print(f"\n結果已儲存至: {os.path.join(out_dir, 'simulation_results_player_level.csv')}")
    print(f"模擬耗時: {time.time() - start_time:.2f} 秒。")

if __name__ == '__main__':
    run_monte_carlo(10000)
