import pandas as pd
import json
import os
import numpy as np

base_dir = "/Users/wilson/Desktop/FIFA_Player_Level"

# 載入 FC26 數據
fc26_path = os.path.join(base_dir, "FC26_20250921.csv")
df_players = pd.read_csv(fc26_path)

# 載入舊版數據以獲取 FIFA 排名與積分
test_path = os.path.join(base_dir, "archive/test (2).csv")
train_path = os.path.join(base_dir, "archive/train (1).csv")

df_test = pd.read_csv(test_path) if os.path.exists(test_path) else pd.DataFrame()
df_train = pd.read_csv(train_path) if os.path.exists(train_path) else pd.DataFrame()

# 2026 世界盃官方的 48 支隊伍與小組分配 (100% 還原真實世界 Wikipedia 分組)
group_mapping = {
    'Mexico': 'A', 'South Korea': 'A', 'South Africa': 'A', 'Czechia': 'A',
    'Canada': 'B', 'Qatar': 'B', 'Switzerland': 'B', 'Bosnia and Herzegovina': 'B',
    'Morocco': 'C', 'Haiti': 'C', 'Brazil': 'C', 'Scotland': 'C',
    'USA': 'D', 'Australia': 'D', 'Paraguay': 'D', 'Turkey': 'D',
    'Ivory Coast': 'E', 'Curacao': 'E', 'Ecuador': 'E', 'Germany': 'E',
    'Japan': 'F', 'Tunisia': 'F', 'Netherlands': 'F', 'Sweden': 'F',
    'Iran': 'G', 'Egypt': 'G', 'New Zealand': 'G', 'Belgium': 'G',
    'Saudi Arabia': 'H', 'Uruguay': 'H', 'Spain': 'H', 'Cabo Verde': 'H',
    'Iraq': 'I', 'Senegal': 'I', 'France': 'I', 'Norway': 'I',
    'Jordan': 'J', 'Algeria': 'J', 'Argentina': 'J', 'Austria': 'J',
    'Uzbekistan': 'K', 'Congo DR': 'K', 'Colombia': 'K', 'Portugal': 'K',
    'Ghana': 'L', 'Panama': 'L', 'Croatia': 'L', 'England': 'L'
}

# 國名在 SoFIFA 裡的映射
sofifa_mapping = {
    'South Korea': 'Korea Republic',
    'Ivory Coast': "Côte d'Ivoire",
    'Turkey': 'Türkiye',
    'USA': 'United States'
}

# 繁體中文國名對照表 (用於虛擬球員命名)
py_translations = {
    'Argentina': '阿根廷', 'Australia': '澳洲', 'Algeria': '阿爾及利亞', 'Austria': '奧地利',
    'Belgium': '比利時', 'Brazil': '巴西', 'Canada': '加拿大', 'Colombia': '哥倫比亞',
    'Congo DR': '剛果民主共和國', 'Croatia': '克羅埃西亞', 'Curacao': '庫拉索', 'Ecuador': '厄瓜多',
    'Egypt': '埃及', 'England': '英格蘭', 'France': '法國', 'Germany': '德國', 'Ghana': '迦納',
    'Haiti': '海地', 'Iran': '伊朗', 'Iraq': '伊拉克', 'Ivory Coast': '科特迪瓦', 'Japan': '日本',
    'Jordan': '約旦', 'Mexico': '墨西哥', 'Morocco': '摩洛哥', 'Netherlands': '荷蘭',
    'New Zealand': '紐西蘭', 'Norway': '挪威', 'Panama': '巴拿馬', 'Paraguay': '巴拉圭',
    'Portugal': '葡萄牙', 'Qatar': '卡達', 'Saudi Arabia': '沙烏地阿拉伯', 'Scotland': '蘇格蘭',
    'Senegal': '塞內加爾', 'South Africa': '南非', 'South Korea': '南韓', 'Spain': '西班牙',
    'Sweden': '瑞典', 'Switzerland': '瑞士', 'Tunisia': '突尼西亞', 'Turkey': '土耳其',
    'Uruguay': '烏拉圭', 'USA': '美國', 'Uzbekistan': '烏茲別克', 'Cabo Verde': '維德角',
    'Bosnia and Herzegovina': '波赫', 'Czechia': '捷克'
}

# 預設宏觀指標（以防捷克、波赫、維德角等在舊數據裡缺失）
default_stats = {
    'Czechia': {'fifa_rank': 35, 'fifa_points': 1500.0, 'recent_form_score': 6.2},
    'Bosnia and Herzegovina': {'fifa_rank': 75, 'fifa_points': 1330.0, 'recent_form_score': 5.8},
    'Cabo Verde': {'fifa_rank': 65, 'fifa_points': 1380.0, 'recent_form_score': 6.0}
}

teams_data = {}

for team in group_mapping.keys():
    # 1. 決定 SoFIFA 中的國籍名字
    sofifa_name = sofifa_mapping.get(team, team)
    
    # 2. 獲取宏觀指標
    df_team_feat = df_test[df_test['team_name'] == team]
    if df_team_feat.empty and not df_train.empty:
        df_team_feat = df_train[df_train['team_name'] == team].head(1)
        
    if not df_team_feat.empty:
        row = df_team_feat.iloc[0]
        fifa_rank = int(row['fifa_rank'])
        fifa_points = float(row['fifa_points'])
        form_score = float(row['recent_form_score'])
    else:
        # 從預設指標取用
        stats = default_stats.get(team, {'fifa_rank': 50, 'fifa_points': 1450.0, 'recent_form_score': 6.0})
        fifa_rank = stats['fifa_rank']
        fifa_points = stats['fifa_points']
        form_score = stats['recent_form_score']
        
    # 3. 篩選該國籍的所有球員
    team_players = df_players[df_players['nationality_name'] == sofifa_name]
    
    players_list = []
    
    # 分選守門員與非守門員
    gks = team_players[team_players['player_positions'].str.contains('GK', na=False)]
    field_players = team_players[~team_players['player_positions'].str.contains('GK', na=False)]
    
    # 4. 先選守門員：最多選 3 個整體評分最高的守門員
    selected_gks = gks.sort_values(by='overall', ascending=False).head(3)
    for _, p in selected_gks.iterrows():
        players_list.append({
            'name': str(p['short_name']).replace('?', 'e'),
            'position': 'GK',
            'overall': int(p['overall']),
            'value_eur': float(p['value_eur']) if not pd.isna(p['value_eur']) else 0.0,
            'is_virtual': False
        })
        
    # 5. 選擇非守門員：按 overall 降序，直到總數達 26
    needed_field = 26 - len(players_list)
    selected_fields = field_players.sort_values(by='overall', ascending=False).head(needed_field)
    
    for _, p in selected_fields.iterrows():
        pos_str = str(p['player_positions']).split(',')[0].strip()
        if pos_str in ['ST', 'CF', 'LW', 'RW', 'LF', 'RF', 'LS', 'RS']:
            pos = 'FW'
        elif pos_str in ['CDM', 'CM', 'CAM', 'LM', 'RM', 'LCM', 'RCM', 'LDM', 'RDM']:
            pos = 'MF'
        else:
            pos = 'DF'
            
        players_list.append({
            'name': str(p['short_name']).replace('?', 'e'),
            'position': pos,
            'overall': int(p['overall']),
            'value_eur': float(p['value_eur']) if not pd.isna(p['value_eur']) else 0.0,
            'is_virtual': False
        })
        
    # 6. 補齊 26 人大名單 (如果該國真實球員不足 26 人)
    current_size = len(players_list)
    if current_size < 26:
        real_overalls = [p['overall'] for p in players_list]
        mean_overall = np.mean(real_overalls) if real_overalls else 65.0
        if pd.isna(mean_overall):
            mean_overall = 65.0
            
        team_cn = py_translations.get(team, team)
        positions_pool = ['GK', 'DF', 'DF', 'DF', 'DF', 'MF', 'MF', 'MF', 'MF', 'FW', 'FW', 'FW']
        for i in range(26 - current_size):
            pos = positions_pool[i % len(positions_pool)]
            overall_noise = int(np.random.randint(-3, 3))
            final_overall = int(max(40, min(99, mean_overall + overall_noise)))
            
            # 虛擬球員身價估值
            val = max(10000.0, (final_overall / 70.0) ** 8 * 1000000.0)
            
            players_list.append({
                'name': f"{team_cn}球員 {i+1}",
                'position': pos,
                'overall': final_overall,
                'value_eur': val,
                'is_virtual': True
            })
            
    # 7. 轉換為 PQS 尺度所需的 efficiency_score，並保留前端需要的格式
    for p in players_list:
        p['efficiency_score'] = max(0.01, (p['overall'] - 50) / 100.0)
        p['goals'] = 0
        p['assists'] = 0
        p['is_star'] = True if (p['overall'] > 82 and not p['is_virtual']) else False
        
    # 8. 計算 PQS 先發與板凳
    sorted_players = sorted(players_list, key=lambda x: x['overall'], reverse=True)
    starting_pqs = np.mean([p['efficiency_score'] for p in sorted_players[:11]])
    bench_pqs = np.mean([p['efficiency_score'] for p in sorted_players[11:]])
    
    # 9. 總體身價（百萬歐元）
    total_val_million = sum([p['value_eur'] for p in players_list]) / 1000000.0
    avg_overall = np.mean([p['overall'] for p in players_list])
    
    teams_data[team] = {
        'team_name': team,
        'group': group_mapping[team],
        'fifa_rank': fifa_rank,
        'fifa_points': fifa_points,
        'market_value_million_eur': float(total_val_million),
        'avg_rating': float(avg_overall),
        'recent_form_score': float(form_score),
        'starting_pqs': float(starting_pqs),
        'bench_pqs': float(bench_pqs),
        'has_data': True,  # 48 隊現在全部都有大名單！
        'players': players_list
    }

# 寫出為前端的 JSON
output_path = os.path.join(base_dir, "frontend/src/teams_db.json")
with open(output_path, 'w', encoding='utf-8') as f:
    json.dump(teams_data, f, indent=2, ensure_ascii=False)
    
print(f"Successfully generated new teams_db.json using FC26. All 48 teams have active rosters!")
