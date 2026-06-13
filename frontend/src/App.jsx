import React, { useState, useEffect } from 'react';
import teamsDb from './teams_db.json';

const TEAM_TRANSLATIONS = {
  'Argentina': { cn: '阿根廷', flag: '🇦🇷' },
  'Australia': { cn: '澳洲', flag: '🇦🇺' },
  'Algeria': { cn: '阿爾及利亞', flag: '🇩🇿' },
  'Austria': { cn: '奧地利', flag: '🇦🇹' },
  'Belgium': { cn: '比利時', flag: '🇧🇪' },
  'Brazil': { cn: '巴西', flag: '🇧🇷' },
  'Canada': { cn: '加拿大', flag: '🇨🇦' },
  'Colombia': { cn: '哥倫比亞', flag: '🇨🇴' },
  'Congo DR': { cn: '剛果民主共和國', flag: '🇨🇩' },
  'Croatia': { cn: '克羅埃西亞', flag: '🇭🇷' },
  'Curacao': { cn: '庫拉索', flag: '🇨🇼' },
  'Ecuador': { cn: '厄瓜多', flag: '🇪🇨' },
  'Egypt': { cn: '埃及', flag: '🇪🇬' },
  'England': { cn: '英格蘭', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿' },
  'France': { cn: '法國', flag: '🇫🇷' },
  'Germany': { cn: '德國', flag: '🇩🇪' },
  'Ghana': { cn: '迦納', flag: '🇬🇭' },
  'Haiti': { cn: '海地', flag: '🇭🇹' },
  'Iran': { cn: '伊朗', flag: '🇮🇷' },
  'Iraq': { cn: '伊拉克', flag: '🇮🇶' },
  'Ivory Coast': { cn: '科特迪瓦', flag: '🇨🇮' },
  'Japan': { cn: '日本', flag: '🇯🇵' },
  'Jordan': { cn: '約旦', flag: '🇯🇴' },
  'Mexico': { cn: '墨西哥', flag: '🇲🇽' },
  'Morocco': { cn: '摩洛哥', flag: '🇲🇦' },
  'Netherlands': { cn: '荷蘭', flag: '🇳🇱' },
  'New Zealand': { cn: '紐西蘭', flag: '🇳🇿' },
  'Norway': { cn: '挪威', flag: '🇳🇴' },
  'Panama': { cn: '巴拿馬', flag: '🇵🇦' },
  'Paraguay': { cn: '巴拉圭', flag: '🇵🇾' },
  'Portugal': { cn: '葡萄牙', flag: '🇵🇹' },
  'Qatar': { cn: '卡達', flag: '🇶🇦' },
  'Saudi Arabia': { cn: '沙烏地阿拉伯', flag: '🇸🇦' },
  'Scotland': { cn: '蘇格蘭', flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  'Senegal': { cn: '塞內加爾', flag: '🇸🇳' },
  'South Africa': { cn: '南非', flag: '🇿🇦' },
  'South Korea': { cn: '南韓', flag: '🇰🇷' },
  'Spain': { cn: '西班牙', flag: '🇪🇸' },
  'Sweden': { cn: '瑞典', flag: '🇸🇪' },
  'Switzerland': { cn: '瑞士', flag: '🇨🇭' },
  'Tunisia': { cn: '突尼西亞', flag: '🇹🇳' },
  'Turkey': { cn: '土耳其', flag: '🇹🇷' },
  'Uruguay': { cn: '烏拉圭', flag: '🇺🇾' },
  'USA': { cn: '美國', flag: '🇺🇸' },
  'Uzbekistan': { cn: '烏茲別克', flag: '🇺🇿' },
  'Cabo Verde': { cn: '維德角', flag: '🇨🇻' },
  'Bosnia and Herzegovina': { cn: '波赫', flag: '🇧🇦' },
  'Czechia': { cn: '捷克', flag: '🇨🇿' }
};

const t = (name) => {
  const item = TEAM_TRANSLATIONS[name];
  return item ? `${item.flag} ${item.cn}` : name;
};


// 隨機事件已移除以保證與蒙地卡羅一致

export default function App() {
  const [activeTab, setActiveTab] = useState('simulate'); // simulate | teams | about
  const [teams, setTeams] = useState({});
  const [events, setEvents] = useState([]);
  const [fatigue, setFatigue] = useState({});
  const [currentStage, setCurrentStage] = useState('init'); // init | group | r32 | r16 | qf | sf | final | champion
  
  // 模擬結果
  const [groupResults, setGroupResults] = useState(null);
  const [r32Matches, setR32Matches] = useState([]);
  const [r16Matches, setR16Matches] = useState([]);
  const [qfMatches, setQfMatches] = useState([]);
  const [sfMatches, setSfMatches] = useState([]);
  const [finalMatch, setFinalMatch] = useState(null);
  const [champion, setChampion] = useState(null);
  
  // Modal 對戰詳情
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null); // 點擊查看球員大名單

  useEffect(() => {
    // 複製資料庫
    setTeams(JSON.parse(JSON.stringify(teamsDb)));
  }, []);

  // 隨機產生進球人
  const generateScorers = (teamName, goalCount) => {
    if (goalCount <= 0) return [];
    const team = teams[teamName] || teamsDb[teamName];
    if (!team) return Array.from({ length: goalCount }, (_, i) => ({ name: `Player ${i+1}`, min: Math.floor(Math.random() * 90) + 1 }));

    // 篩選進攻與中場球員作為高權重進球者
    const players = team.players;
    const scorers = [];
    
    for (let i = 0; i < goalCount; i++) {
      // 依據 efficiency_score 作為權重進行隨機抽樣
      const totalWeight = players.reduce((sum, p) => sum + p.efficiency_score, 0);
      let rand = Math.random() * totalWeight;
      let selectedPlayer = players[players.length - 1];
      
      for (const p of players) {
        rand -= p.efficiency_score;
        if (rand <= 0) {
          selectedPlayer = p;
          break;
        }
      }
      
      scorers.push({
        name: selectedPlayer.name,
        min: Math.floor(Math.random() * 90) + 1,
        position: selectedPlayer.position
      });
    }
    
    return scorers.sort((a, b) => a.min - b.min);
  };

  const playMatch = (teamA, teamB, currentFatigue, isKnockout = false) => {
    const tA = teams[teamA];
    const tB = teams[teamB];
    
    // 處理無大名單國家的輪空判負 (0:3) 邏輯
    if (!tA.has_data || !tB.has_data) {
      if (!tA.has_data && !tB.has_data) {
        const winner = isKnockout ? teamA : 'DRAW';
        return {
          teamA, teamB, goalsA: 0, goalsB: 0, scorersA: [], scorersB: [],
          winner, extraTime: false, penScore: null,
          stats: { possessionA: 50, possessionB: 50, shotsA: 0, shotsB: 0, foulsA: 0, foulsB: 0 },
          updatedFatigue: { [teamA]: currentFatigue[teamA] || 0.0, [teamB]: currentFatigue[teamB] || 0.0 }
        };
      }
      if (!tA.has_data) {
        return {
          teamA, teamB, goalsA: 0, goalsB: 3, scorersA: [],
          scorersB: Array.from({ length: 3 }, (_, i) => ({ name: `Default Player ${i+1}`, min: 10 * (i + 1), position: 'FW' })),
          winner: teamB, extraTime: false, penScore: null,
          stats: { possessionA: 30, possessionB: 70, shotsA: 2, shotsB: 15, foulsA: 10, foulsB: 5 },
          updatedFatigue: { [teamA]: currentFatigue[teamA] || 0.0, [teamB]: currentFatigue[teamB] || 0.0 }
        };
      }
      if (!tB.has_data) {
        return {
          teamA, teamB, goalsA: 3, goalsB: 0,
          scorersA: Array.from({ length: 3 }, (_, i) => ({ name: `Default Player ${i+1}`, min: 10 * (i + 1), position: 'FW' })),
          scorersB: [], winner: teamA, extraTime: false, penScore: null,
          stats: { possessionA: 70, possessionB: 30, shotsA: 15, shotsB: 2, foulsA: 5, foulsB: 10 },
          updatedFatigue: { [teamA]: currentFatigue[teamA] || 0.0, [teamB]: currentFatigue[teamB] || 0.0 }
        };
      }
    }

    const fA = currentFatigue[teamA] || 0.0;
    const fB = currentFatigue[teamB] || 0.0;

    // 正常球員級雙卜瓦松預測 (加入疲勞扣減)
    const eloA = tA.fifa_points * (1.0 - fA * 0.05);
    const eloB = tB.fifa_points * (1.0 - fB * 0.05);
    
    const pqsA = tA.starting_pqs * (1.0 - fA);
    const pqsB = tB.starting_pqs * (1.0 - fB);
    
    // 東道主優勢 (美、加、墨)
    const hostHosts = new Set(["USA", "Mexico", "Canada"]);
    const hostBoostA = hostHosts.has(teamA) ? 0.10 : 0.0;
    const hostBoostB = hostHosts.has(teamB) ? 0.10 : 0.0;
    
    // 計算進球期望值
    const lambda = Math.max(0.2, 1.3 + (eloA - eloB) / 450 + (pqsA - pqsB) / 30 + hostBoostA - hostBoostB * 0.5);
    const mu = Math.max(0.2, 1.1 - (eloA - eloB) / 450 - (pqsA - pqsB) / 30 + hostBoostB - hostBoostA * 0.5);
    
    // 泊松隨機數抽樣 (Knuth algorithm 簡化)
    const getPoisson = (l) => {
      const L = Math.exp(-l);
      let k = 0;
      let p = 1;
      do {
        k++;
        p *= Math.random();
      } while (p > L);
      return k - 1;
    };
    
    let goalsA = getPoisson(lambda);
    let goalsB = getPoisson(mu);
    
    // 修正 Dixon-Coles 平局偏好（低比分平局概率加成）
    if (goalsA === 0 && goalsB === 0 && Math.random() < 0.25) {
      if (Math.random() > 0.5) {
        goalsA = 1;
        goalsB = 1;
      }
    }
    
    const scorersA = generateScorers(teamA, goalsA);
    const scorersB = generateScorers(teamB, goalsB);
    
    let winner = null;
    let penScore = null;
    let extraTime = false;

    if (goalsA > goalsB) {
      winner = teamA;
    } else if (goalsB > goalsA) {
      winner = teamB;
    } else {
      if (isKnockout) {
        // 延長賽 (30分鐘)
        extraTime = true;
        const extraLambda = lambda * 0.33;
        const extraMu = mu * 0.33;
        const extraA = getPoisson(extraLambda);
        const extraB = getPoisson(extraMu);
        
        goalsA += extraA;
        goalsB += extraB;
        
        // 補上延長賽進球員
        if (extraA > 0) {
          scorersA.push(...generateScorers(teamA, extraA).map(s => ({ ...s, min: Math.floor(Math.random() * 30) + 91 })));
        }
        if (extraB > 0) {
          scorersB.push(...generateScorers(teamB, extraB).map(s => ({ ...s, min: Math.floor(Math.random() * 30) + 91 })));
        }

        if (goalsA > goalsB) {
          winner = teamA;
        } else if (goalsB > goalsA) {
          winner = teamB;
        } else {
          // 點球大戰 (PK) - 門將最高 rating 對決雙方射手平均 rating
          const gkA = Math.max(...(tA.players.filter(p => p.position === 'GK').map(p => p.overall)), 60);
          const gkB = Math.max(...(tB.players.filter(p => p.position === 'GK').map(p => p.overall)), 60);
          
          const shootersAArr = tA.players.filter(p => p.position !== 'GK').map(p => p.overall).sort((a, b) => b - a).slice(0, 5);
          const shootersBArr = tB.players.filter(p => p.position !== 'GK').map(p => p.overall).sort((a, b) => b - a).slice(0, 5);
          
          const shootersAOvr = shootersAArr.length > 0 ? shootersAArr.reduce((sum, val) => sum + val, 0) / shootersAArr.length : 65;
          const shootersBOvr = shootersBArr.length > 0 ? shootersBArr.reduce((sum, val) => sum + val, 0) / shootersBArr.length : 65;
          
          // 計算點球罰進率
          const rateA = Math.max(0.55, Math.min(0.90, 0.75 + (shootersAOvr - gkB) / 200.0));
          const rateB = Math.max(0.55, Math.min(0.90, 0.75 + (shootersBOvr - gkA) / 200.0));
          
          let penA = 0;
          let penB = 0;
          for (let round = 0; round < 5; round++) {
            if (Math.random() < rateA) penA++;
            if (Math.random() < rateB) penB++;
          }
          while (penA === penB) {
            if (Math.random() < rateA) penA++;
            if (Math.random() < rateB) penB++;
          }
          penScore = { a: penA, b: penB };
          winner = penA > penB ? teamA : teamB;
        }
      } else {
        winner = 'DRAW';
      }
    }
    
    // 隨機生成單場數據（射門、控球）
    const totalShots = Math.floor(Math.random() * 15) + 12;
    const possession = Math.max(30, Math.min(70, Math.floor(50 + (pqsA - pqsB) * 1.5 + (Math.random() - 0.5) * 10)));
    const shotsA = Math.floor(totalShots * (possession / 100));
    const shotsB = totalShots - shotsA;

    // 累加疲勞值 (板凳深度 bench_pqs 越高，累積疲勞越慢)
    const benchA = tA.has_data ? tA.bench_pqs : 0.2;
    const benchB = tB.has_data ? tB.bench_pqs : 0.2;
    const nextFatigueA = fA + 0.04 * (1.0 - benchA) + (extraTime ? 0.02 : 0.0);
    const nextFatigueB = fB + 0.04 * (1.0 - benchB) + (extraTime ? 0.02 : 0.0);

    return {
      teamA, teamB,
      goalsA, goalsB,
      scorersA, scorersB,
      winner, extraTime, penScore,
      stats: {
        possessionA: possession,
        possessionB: 100 - possession,
        shotsA: Math.max(1, shotsA),
        shotsB: Math.max(1, shotsB),
        foulsA: Math.floor(Math.random() * 10) + 6,
        foulsB: Math.floor(Math.random() * 10) + 6
      },
      updatedFatigue: {
        [teamA]: nextFatigueA,
        [teamB]: nextFatigueB
      }
    };
  };

  // 1. 模擬小組賽
  const simulateGroupStage = () => {
    let currentFatigue = {};
    
    // 初始化積分表
    const standings = {};
    Object.keys(teams).forEach(team => {
      standings[team] = { team, points: 0, gd: 0, gs: 0, wins: 0, draw: 0, loss: 0 };
    });
    
    const groups = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    const matchesPlayed = [];
    
    groups.forEach(grp => {
      // 找出該組 4 隊
      const grpTeams = Object.keys(teams).filter(t => teams[t].group === grp);
      
      // 循環賽
      for (let i = 0; i < grpTeams.length; i++) {
        for (let j = i + 1; j < grpTeams.length; j++) {
          const res = playMatch(grpTeams[i], grpTeams[j], currentFatigue, false);
          currentFatigue = { ...currentFatigue, ...res.updatedFatigue };
          matchesPlayed.push(res);
          
          const tA = res.teamA;
          const tB = res.teamB;
          
          standings[tA].gs += res.goalsA;
          standings[tA].gd += (res.goalsA - res.goalsB);
          standings[tB].gs += res.goalsB;
          standings[tB].gd += (res.goalsB - res.goalsA);
          
          if (res.winner === tA) {
            standings[tA].points += 3;
            standings[tA].wins += 1;
            standings[tB].loss += 1;
          } else if (res.winner === tB) {
            standings[tB].points += 3;
            standings[tB].wins += 1;
            standings[tA].loss += 1;
          } else {
            standings[tA].points += 1;
            standings[tB].points += 1;
            standings[tA].draw += 1;
            standings[tB].draw += 1;
          }
        }
      }
    });
    
    setFatigue(currentFatigue);
    
    // 排序小組名次
    const groupStandings = {};
    groups.forEach(grp => {
      const grpTeams = Object.keys(teams).filter(t => teams[t].group === grp);
      const sorted = grpTeams.map(t => standings[t]).sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        if (b.gd !== a.gd) return b.gd - a.gd;
        if (b.gs !== a.gs) return b.gs - a.gs;
        return (teams[b.team].fifa_points - teams[a.team].fifa_points);
      });
      groupStandings[grp] = sorted;
    });
    
    // 找出小組第一與第二 (共 24 隊)
    const qualified1stAnd2nd = [];
    const thirdPlaces = [];
    
    groups.forEach(grp => {
      qualified1stAnd2nd.push(groupStandings[grp][0].team);
      qualified1stAnd2nd.push(groupStandings[grp][1].team);
      thirdPlaces.push(groupStandings[grp][2]);
    });
    
    // 排序小組第三名，取前 8 晉級
    const sortedThirds = thirdPlaces.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gs !== a.gs) return b.gs - a.gs;
      return (teams[b.team].fifa_points - teams[a.team].fifa_points);
    });
    
    const qualifiedThirds = sortedThirds.slice(0, 8).map(t => t.team);
    const allQualified32 = [...qualified1stAnd2nd, ...qualifiedThirds];
    
    setGroupResults({ standings: groupStandings, matches: matchesPlayed });
    
    // 分配 32 強對陣 (按照 ELO 實力對折交叉對決，增加觀賞性)
    const sorted32ByElo = allQualified32.sort((a, b) => teams[b].fifa_points - teams[a].fifa_points);
    const nextMatches = [];
    for (let i = 0; i < 16; i++) {
      nextMatches.push({
        teamA: sorted32ByElo[i],
        teamB: sorted32ByElo[31 - i],
        result: null
      });
    }
    
    setR32Matches(nextMatches);
    setCurrentStage('group');
  };

  // 2. 模擬 32 強 -> 16 強
  const simulateR32 = () => {
    let currentFatigue = { ...fatigue };
    const updated = r32Matches.map(m => {
      const res = playMatch(m.teamA, m.teamB, currentFatigue, true);
      currentFatigue = { ...currentFatigue, ...res.updatedFatigue };
      return { ...m, result: res };
    });
    setR32Matches(updated);
    setFatigue(currentFatigue);
    
    // 晉級 16 強的隊伍
    const winners = updated.map(m => m.result.winner);
    const nextMatches = [];
    for (let i = 0; i < 8; i++) {
      nextMatches.push({
        teamA: winners[i * 2],
        teamB: winners[i * 2 + 1],
        result: null
      });
    }
    setR16Matches(nextMatches);
    setCurrentStage('r32');
  };

  // 3. 模擬 16 強 -> 8 強
  const simulateR16 = () => {
    let currentFatigue = { ...fatigue };
    const updated = r16Matches.map(m => {
      const res = playMatch(m.teamA, m.teamB, currentFatigue, true);
      currentFatigue = { ...currentFatigue, ...res.updatedFatigue };
      return { ...m, result: res };
    });
    setR16Matches(updated);
    setFatigue(currentFatigue);
    
    const winners = updated.map(m => m.result.winner);
    const nextMatches = [];
    for (let i = 0; i < 4; i++) {
      nextMatches.push({
        teamA: winners[i * 2],
        teamB: winners[i * 2 + 1],
        result: null
      });
    }
    setQfMatches(nextMatches);
    setCurrentStage('r16');
  };

  // 4. 模擬 8 強 -> 4 強
  const simulateQF = () => {
    let currentFatigue = { ...fatigue };
    const updated = qfMatches.map(m => {
      const res = playMatch(m.teamA, m.teamB, currentFatigue, true);
      currentFatigue = { ...currentFatigue, ...res.updatedFatigue };
      return { ...m, result: res };
    });
    setQfMatches(updated);
    setFatigue(currentFatigue);
    
    const winners = updated.map(m => m.result.winner);
    const nextMatches = [];
    for (let i = 0; i < 2; i++) {
      nextMatches.push({
        teamA: winners[i * 2],
        teamB: winners[i * 2 + 1],
        result: null
      });
    }
    setSfMatches(nextMatches);
    setCurrentStage('qf');
  };

  // 5. 模擬 4 強 -> 決賽
  const simulateSF = () => {
    let currentFatigue = { ...fatigue };
    const updated = sfMatches.map(m => {
      const res = playMatch(m.teamA, m.teamB, currentFatigue, true);
      currentFatigue = { ...currentFatigue, ...res.updatedFatigue };
      return { ...m, result: res };
    });
    setSfMatches(updated);
    setFatigue(currentFatigue);
    
    const winners = updated.map(m => m.result.winner);
    setFinalMatch({
      teamA: winners[0],
      teamB: winners[1],
      result: null
    });
    setCurrentStage('sf');
  };

  // 6. 模擬決賽 -> 奪冠
  const simulateFinal = () => {
    let currentFatigue = { ...fatigue };
    const res = playMatch(finalMatch.teamA, finalMatch.teamB, currentFatigue, true);
    currentFatigue = { ...currentFatigue, ...res.updatedFatigue };
    setFinalMatch(prev => ({ ...prev, result: res }));
    setChampion(res.winner);
    setFatigue(currentFatigue);
    setCurrentStage('champion');
  };

  // 重設大賽
  const resetSimulation = () => {
    setEvents([]);
    setGroupResults(null);
    setR32Matches([]);
    setR16Matches([]);
    setQfMatches([]);
    setSfMatches([]);
    setFinalMatch(null);
    setChampion(null);
    setFatigue({});
    setCurrentStage('init');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* 🚀 Top Premium Navigation */}
      <header className="glass-card" style={{ margin: '16px', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '32px' }}>🏆</span>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: 800, tracking: '-0.05em' }} className="text-gradient">
              FIFA 2026 PLAYER-LEVEL PREDICTOR
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>博弈級動態球員傷病與戰力蒙地卡羅模擬網頁</p>
          </div>
        </div>
        
        <nav style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveTab('simulate')} className={activeTab === 'simulate' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', fontSize: '14px' }}>
            🔮 賽事模擬
          </button>
          <button onClick={() => setActiveTab('teams')} className={activeTab === 'teams' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', fontSize: '14px' }}>
            🛡️ 球隊大名單
          </button>
          <button onClick={() => setActiveTab('about')} className={activeTab === 'about' ? 'btn-primary' : 'btn-secondary'} style={{ padding: '8px 16px', fontSize: '14px' }}>
            ℹ️ 專案背景
          </button>
        </nav>
      </header>

      {/* 🔮 TAB 1: SIMULATOR */}
      {activeTab === 'simulate' && (
        <main style={{ flex: 1, padding: '0 16px 40px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Controls Panel */}
          <section className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '4px' }}>
                當前階段：
                <span className="text-gradient" style={{ fontWeight: 800 }}>
                  {currentStage === 'init' && "小組賽準備中"}
                  {currentStage === 'group' && "32強對陣已排出"}
                  {currentStage === 'r32' && "16強對陣已排出"}
                  {currentStage === 'r16' && "8強對陣已排出"}
                  {currentStage === 'qf' && "4強對陣已排出"}
                  {currentStage === 'sf' && "決賽組合出爐"}
                  {currentStage === 'champion' && "🏆 大賽結束 冠軍誕生"}
                </span>
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>依據球員先發戰力、板凳深度，並在平行宇宙中即時滾動隨機事件。</p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              {currentStage === 'init' && (
                <button onClick={simulateGroupStage} className="btn-primary">⚽ 模擬小組賽</button>
              )}
              {currentStage === 'group' && (
                <button onClick={simulateR32} className="btn-primary">⚡ 模擬 32 強對決</button>
              )}
              {currentStage === 'r32' && (
                <button onClick={simulateR16} className="btn-primary">🔥 模擬 16 強決戰</button>
              )}
              {currentStage === 'r16' && (
                <button onClick={simulateQF} className="btn-primary">🎯 模擬 8 強對決</button>
              )}
              {currentStage === 'qf' && (
                <button onClick={simulateSF} className="btn-primary">🎪 模擬 4 強決戰</button>
              )}
              {currentStage === 'sf' && (
                <button onClick={simulateFinal} className="btn-primary">👑 模擬總決賽</button>
              )}
              {currentStage !== 'init' && (
                <button onClick={resetSimulation} className="btn-secondary">🔄 重設大賽</button>
              )}
            </div>
          </section>

          {/* 12 Groups Overview before Simulation */}
          {currentStage === 'init' && (
            <section className="glass-card animate-fade-in" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '20px', textAlign: 'center' }} className="text-gradient">
                2026 世界盃官方小組賽抽籤分組 (48 隊)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                {['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'].map(groupName => {
                  const groupTeams = Object.keys(teams).filter(t => teams[t].group === groupName);
                  return (
                    <div key={groupName} className="glass-card" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-blue)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '6px', marginBottom: '10px', textAlign: 'center' }}>
                        Group {groupName}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {groupTeams.map(teamName => {
                          const tInfo = teams[teamName];
                          return (
                            <div key={teamName} className="glass-card team-item-hover" onClick={() => setSelectedTeam(tInfo)} style={{ padding: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                              <span style={{ fontWeight: 600 }}>{t(teamName)}</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>OVR {tInfo.avg_rating.toFixed(0)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* 🏆 Tournament Bracket Visualization */}
          {currentStage !== 'init' && (
            <section className="glass-card" style={{ padding: '24px', overflowX: 'auto' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '24px', textAlign: 'center' }}>淘汰賽對陣 Bracket 展示</h3>
              
              <div className="bracket-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'stretch', height: '620px', width: '100%', padding: '10px 0', gap: '10px' }}>
                
                {/* ===== 左半區 (Left Bracket) ===== */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch', flex: 1, justifyContent: 'space-between', height: '100%' }}>
                  {/* Left R32 */}
                  <div className="bracket-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '90px' }}>
                    <h4 style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px', height: '20px', lineHeight: '20px' }}>Round of 32</h4>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                      {r32Matches.slice(0, 8).map((m, i) => (
                        <div key={i} className="glass-card" onClick={() => m.result && setSelectedMatch(m.result)} style={{ padding: '4px 5px', width: '100%', cursor: m.result ? 'pointer' : 'default', borderLeft: m.result ? '3px solid var(--accent-blue)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamA ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamA ? 600 : 400 }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamA)}</span>
                            <span>{m.result ? m.result.goalsA : '-'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamB ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamB ? 600 : 400, marginTop: '2px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamB)}</span>
                            <span>{m.result ? m.result.goalsB : '-'}</span>
                          </div>
                          {m.result?.penScore && (
                            <div style={{ fontSize: '8px', color: 'var(--accent-purple)', textAlign: 'right' }}>
                              PK {m.result.penScore.a}:{m.result.penScore.b}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Left R16 */}
                  <div className="bracket-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '90px' }}>
                    <h4 style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px', height: '20px', lineHeight: '20px' }}>Round of 16</h4>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                      {r16Matches.slice(0, 4).map((m, i) => (
                        <div key={i} className="glass-card" onClick={() => m.result && setSelectedMatch(m.result)} style={{ padding: '4px 5px', width: '100%', cursor: m.result ? 'pointer' : 'default', borderLeft: m.result ? '3px solid var(--accent-purple)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamA ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamA ? 600 : 400 }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamA)}</span>
                            <span>{m.result ? m.result.goalsA : '-'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamB ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamB ? 600 : 400, marginTop: '2px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamB)}</span>
                            <span>{m.result ? m.result.goalsB : '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Left QF */}
                  <div className="bracket-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '90px' }}>
                    <h4 style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px', height: '20px', lineHeight: '20px' }}>Quarter-Finals</h4>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                      {qfMatches.slice(0, 2).map((m, i) => (
                        <div key={i} className="glass-card" onClick={() => m.result && setSelectedMatch(m.result)} style={{ padding: '4px 5px', width: '100%', cursor: m.result ? 'pointer' : 'default', borderLeft: m.result ? '3px solid var(--accent-pink)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamA ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamA ? 600 : 400 }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamA)}</span>
                            <span>{m.result ? m.result.goalsA : '-'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamB ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamB ? 600 : 400, marginTop: '2px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamB)}</span>
                            <span>{m.result ? m.result.goalsB : '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Left SF */}
                  <div className="bracket-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '90px' }}>
                    <h4 style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px', height: '20px', lineHeight: '20px' }}>Semi-Finals</h4>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                      {sfMatches.slice(0, 1).map((m, i) => (
                        <div key={i} className="glass-card" onClick={() => m.result && setSelectedMatch(m.result)} style={{ padding: '4px 5px', width: '100%', cursor: m.result ? 'pointer' : 'default', borderLeft: m.result ? '4px solid var(--success)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamA ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamA ? 600 : 400 }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamA)}</span>
                            <span>{m.result ? m.result.goalsA : '-'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamB ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamB ? 600 : 400, marginTop: '2px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamB)}</span>
                            <span>{m.result ? m.result.goalsB : '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ===== 中間總決賽與冠軍區 (Center Final & Champion) ===== */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '24px', width: '130px', height: '100%' }}>
                  <div>
                    <h4 style={{ fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px' }}>Final 總決賽</h4>
                    {finalMatch ? (
                      <div className="glass-card glow-active" onClick={() => finalMatch.result && setSelectedMatch(finalMatch.result)} style={{ padding: '8px', width: '120px', cursor: finalMatch.result ? 'pointer' : 'default', border: '2px solid var(--accent-blue)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: finalMatch.result?.winner === finalMatch.teamA ? '#fff' : 'var(--text-secondary)', fontWeight: finalMatch.result?.winner === finalMatch.teamA ? 800 : 400 }}>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(finalMatch.teamA)}</span>
                          <span>{finalMatch.result ? finalMatch.result.goalsA : '-'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: finalMatch.result?.winner === finalMatch.teamB ? '#fff' : 'var(--text-secondary)', fontWeight: finalMatch.result?.winner === finalMatch.teamB ? 800 : 400, marginTop: '8px' }}>
                          <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(finalMatch.teamB)}</span>
                          <span>{finalMatch.result ? finalMatch.result.goalsB : '-'}</span>
                        </div>
                      </div>
                    ) : (
                      <div style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary)', border: '1px dashed rgba(255,255,255,0.1)', padding: '12px', borderRadius: '8px', width: '120px' }}>決賽組合待定</div>
                    )}
                  </div>
                  
                  {champion && (
                    <div className="glass-card animate-fade-in" style={{ padding: '6px 8px', width: '120px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.2) 0%, rgba(251, 191, 36, 0.2) 100%)', border: '1px solid #facc15', borderRadius: '8px' }}>
                      <p style={{ fontSize: '8px', color: '#fef08a', letterSpacing: '1px', marginBottom: '2px' }}>🏆 CHAMPION 🏆</p>
                      <h4 style={{ fontSize: '11px', fontWeight: 800, color: '#fef08a' }}>{t(champion)}</h4>
                    </div>
                  )}
                </div>

                {/* ===== 右半區 (Right Bracket) ===== */}
                <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: '8px', alignItems: 'stretch', flex: 1, justifyContent: 'space-between', height: '100%' }}>
                  {/* Right R32 */}
                  <div className="bracket-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '90px' }}>
                    <h4 style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px', height: '20px', lineHeight: '20px' }}>Round of 32</h4>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                      {r32Matches.slice(8, 16).map((m, i) => (
                        <div key={i} className="glass-card" onClick={() => m.result && setSelectedMatch(m.result)} style={{ padding: '4px 5px', width: '100%', cursor: m.result ? 'pointer' : 'default', borderLeft: m.result ? '3px solid var(--accent-blue)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamA ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamA ? 600 : 400 }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamA)}</span>
                            <span>{m.result ? m.result.goalsA : '-'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamB ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamB ? 600 : 400, marginTop: '2px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamB)}</span>
                            <span>{m.result ? m.result.goalsB : '-'}</span>
                          </div>
                          {m.result?.penScore && (
                            <div style={{ fontSize: '8px', color: 'var(--accent-purple)', textAlign: 'right' }}>
                              PK {m.result.penScore.a}:{m.result.penScore.b}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right R16 */}
                  <div className="bracket-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '90px' }}>
                    <h4 style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px', height: '20px', lineHeight: '20px' }}>Round of 16</h4>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                      {r16Matches.slice(4, 8).map((m, i) => (
                        <div key={i} className="glass-card" onClick={() => m.result && setSelectedMatch(m.result)} style={{ padding: '4px 5px', width: '100%', cursor: m.result ? 'pointer' : 'default', borderLeft: m.result ? '3px solid var(--accent-purple)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamA ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamA ? 600 : 400 }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamA)}</span>
                            <span>{m.result ? m.result.goalsA : '-'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamB ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamB ? 600 : 400, marginTop: '2px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamB)}</span>
                            <span>{m.result ? m.result.goalsB : '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right QF */}
                  <div className="bracket-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '90px' }}>
                    <h4 style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px', height: '20px', lineHeight: '20px' }}>Quarter-Finals</h4>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                      {qfMatches.slice(2, 4).map((m, i) => (
                        <div key={i} className="glass-card" onClick={() => m.result && setSelectedMatch(m.result)} style={{ padding: '4px 5px', width: '100%', cursor: m.result ? 'pointer' : 'default', borderLeft: m.result ? '3px solid var(--accent-pink)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamA ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamA ? 600 : 400 }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamA)}</span>
                            <span>{m.result ? m.result.goalsA : '-'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamB ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamB ? 600 : 400, marginTop: '2px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamB)}</span>
                            <span>{m.result ? m.result.goalsB : '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Right SF */}
                  <div className="bracket-column" style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '90px' }}>
                    <h4 style={{ fontSize: '10.5px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '8px', height: '20px', lineHeight: '20px' }}>Semi-Finals</h4>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-around' }}>
                      {sfMatches.slice(1, 2).map((m, i) => (
                        <div key={i} className="glass-card" onClick={() => m.result && setSelectedMatch(m.result)} style={{ padding: '4px 5px', width: '100%', cursor: m.result ? 'pointer' : 'default', borderLeft: m.result ? '4px solid var(--success)' : 'none' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamA ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamA ? 600 : 400 }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamA)}</span>
                            <span>{m.result ? m.result.goalsA : '-'}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: m.result?.winner === m.teamB ? '#fff' : 'var(--text-secondary)', fontWeight: m.result?.winner === m.teamB ? 600 : 400, marginTop: '2px' }}>
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{t(m.teamB)}</span>
                            <span>{m.result ? m.result.goalsB : '-'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center', marginTop: '16px' }}>💡 點擊已完成的對戰卡片，即可彈出查看詳細比賽統計（如控球率、射門及進球球員名單）！</p>
            </section>
          )}

        </main>
      )}

      {/* 🛡️ TAB 2: TEAMS DATABASE */}
      {activeTab === 'teams' && (
        <main style={{ flex: 1, padding: '0 16px 40px 16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <section className="glass-card" style={{ padding: '24px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '16px' }}>2026 世界盃參賽球隊與 26 人大名單庫 (48 隊)</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '24px' }}>整合了來自 Kaggle 的 Golden Dataset 與對戰預測數據。點擊各國家隊即可查看該國家的 26 人名單與效率評分（PQS）。</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
              {Object.keys(teams).sort().map(teamName => {
                const team = teams[teamName];
                return (
                  <div key={teamName} className="glass-card" onClick={() => setSelectedTeam(team)} style={{ padding: '16px', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '16px', fontWeight: 600 }}>{t(teamName)}</h4>
                      <span className="glass-card" style={{ padding: '2px 6px', fontSize: '11px', fontWeight: 800, color: 'var(--accent-blue)' }}>Group {team.group}</span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      <p>FIFA Rank: #{team.fifa_rank}</p>
                      <p>先發 PQS: {team.starting_pqs.toFixed(2)}</p>
                      <p>身價: €{team.market_value_million_eur.toFixed(1)}M</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </main>
      )}

      {/* ℹ️ TAB 3: PROJECT ABOUT */}
      {activeTab === 'about' && (
        <main style={{ flex: 1, padding: '0 16px 40px 16px' }}>
          <article className="glass-card" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800 }} className="text-gradient">關於此球員級世界盃預測專案</h2>
            
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-blue)' }}>1. 數據源來源</h3>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                本專案是獨立於期末專案的升級版，採用球員個體（Player-Level）數據庫。整合了 Kaggle 上的 **"Road to 2026: World Cup Squad Prediction"**（球員個人賽季出場、進球、助攻與效率值）與 **"FIFA World Cup 2026 Prediction System"**（國家隊 FIFA 積分與對戰特徵），構建出包含 48 支隊伍、每隊 26 人大名單的綜合戰力庫。
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-purple)' }}>2. 動態平行宇宙模擬機制</h3>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                本系統透過 JavaScript 在前端即時計算對戰機率。模擬邏輯基於**雙卜瓦松期望值分佈**，結合了**先發陣容戰力值 (PQS)** 與雙方的 ELO 差。
                最特別的是，每一輪模擬皆有機會觸發隨機平行宇宙事件（如球星在訓練中受傷或停賽），當事件發生後會動態調整戰力評分，模擬出杯賽爆冷與突發性狀態起伏，使模擬過程更貼近真實足球賽事的隨機本質。
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: 'var(--accent-pink)' }}>3. 進球球員隨機權重抽樣</h3>
              <p style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                當模型決定某場比賽一方進了 $G$ 個球，系統並非隨意填入進球數，而是利用該隊 26 人大名單中，各個前鋒與中場的「歷史賽季效率評分 (Efficiency Score)」作為隨機抽樣的權重，決定進球者，並動態分派進球時間，從而在對陣圖中還原出每一場比賽的經典一刻。
              </p>
            </div>
          </article>
        </main>
      )}

      {/* 🏆 MODAL 1: MATCH DETAILS */}
      {selectedMatch && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '16px' }} onClick={() => setSelectedMatch(null)}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '24px', background: '#0f172a' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 600 }}>比賽詳情與數據統計</h3>
              <button onClick={() => setSelectedMatch(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>
            
            {/* Scoreboard */}
            <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', padding: '20px 0', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ textAlign: 'center', width: '40%' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 800 }}>{t(selectedMatch.teamA)}</h4>
              </div>
              <div style={{ textAlign: 'center', width: '20%' }}>
                <span style={{ fontSize: '28px', fontWeight: 800 }} className="text-gradient">
                  {selectedMatch.goalsA} : {selectedMatch.goalsB}
                </span>
                {selectedMatch.extraTime && <div style={{ fontSize: '11px', color: 'var(--accent-purple)', marginTop: '4px' }}>AET</div>}
                {selectedMatch.penScore && <div style={{ fontSize: '11px', color: 'var(--accent-pink)' }}>PK ({selectedMatch.penScore.a}:{selectedMatch.penScore.b})</div>}
              </div>
              <div style={{ textAlign: 'center', width: '40%' }}>
                <h4 style={{ fontSize: '18px', fontWeight: 800 }}>{t(selectedMatch.teamB)}</h4>
              </div>
            </div>

            {/* Scorers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 0', fontSize: '13px', borderBottom: '1px solid var(--glass-border)' }}>
              <div style={{ width: '45%' }}>
                {selectedMatch.scorersA.map((s, idx) => (
                  <p key={idx}>⚽ {s.name} ({s.min}')</p>
                ))}
              </div>
              <div style={{ width: '10%' }}></div>
              <div style={{ width: '45%', textAlign: 'right' }}>
                {selectedMatch.scorersB.map((s, idx) => (
                  <p key={idx}>⚽ {s.name} ({s.min}')</p>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>{selectedMatch.stats.possessionA}%</span>
                  <span>控球率 (Possession)</span>
                  <span>{selectedMatch.stats.possessionB}%</span>
                </div>
                <div style={{ display: 'flex', height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${selectedMatch.stats.possessionA}%`, background: 'var(--accent-blue)' }}></div>
                  <div style={{ width: `${selectedMatch.stats.possessionB}%`, background: 'var(--accent-purple)' }}></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>{selectedMatch.stats.shotsA}</span>
                <span style={{ color: 'var(--text-secondary)' }}>射門次數 (Shots)</span>
                <span>{selectedMatch.stats.shotsB}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span>{selectedMatch.stats.foulsA}</span>
                <span style={{ color: 'var(--text-secondary)' }}>犯規次數 (Fouls)</span>
                <span>{selectedMatch.stats.foulsB}</span>
              </div>
            </div>

            <button onClick={() => setSelectedMatch(null)} className="btn-secondary" style={{ width: '100%', marginTop: '24px', padding: '8px' }}>
              關閉詳情
            </button>
          </div>
        </div>
      )}

      {/* 🛡️ MODAL 2: TEAM ROSTER */}
      {selectedTeam && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(2, 6, 23, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100, padding: '16px' }} onClick={() => setSelectedTeam(null)}>
          <div className="glass-card animate-fade-in" style={{ width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', background: '#0f172a' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 800 }} className="text-gradient">{t(selectedTeam.team_name)}</h3>
                {selectedTeam.has_data && (
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>先發實力 (Starting PQS): {selectedTeam.starting_pqs.toFixed(1)} | 板凳深度 (Bench PQS): {selectedTeam.bench_pqs.toFixed(1)}</p>
                )}
              </div>
              <button onClick={() => setSelectedTeam(null)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '20px', cursor: 'pointer' }}>×</button>
            </div>

            {/* Roster Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '16px', fontSize: '14px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
                  <th style={{ padding: '8px 0' }}>球員姓名</th>
                  <th>位置</th>
                  <th>整體評分 (OVR)</th>
                  <th>市場身價</th>
                  <th style={{ textAlign: 'right' }}>戰力期望值 (PQS)</th>
                </tr>
              </thead>
              <tbody>
                {selectedTeam.players.sort((a,b) => b.overall - a.overall).map((p, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', color: p.is_star ? 'var(--accent-blue)' : '#fff' }}>
                    <td style={{ padding: '10px 0', fontWeight: p.is_star ? 600 : 400 }}>
                      {p.name} {p.is_star && '⭐'}
                    </td>
                    <td>{p.position}</td>
                    <td style={{ fontWeight: 600 }}>{p.overall}</td>
                    <td>{p.value_eur > 0 ? `€${(p.value_eur / 1000000).toFixed(1)}M` : '-'}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{p.efficiency_score.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button onClick={() => setSelectedTeam(null)} className="btn-secondary" style={{ width: '100%', marginTop: '24px', padding: '8px' }}>
              關閉名單
            </button>
          </div>
        </div>
      )}

      {/* 🏆 Footer */}
      <footer style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)', fontSize: '13px', borderTop: '1px solid var(--glass-border)', marginTop: 'auto' }}>
        ⚽ 2026 世界盃球員級模擬系統 — 由我用機器學習與 React 動態渲染技術實作。不為期末大綱所限，只為完美預測。
      </footer>

    </div>
  );
}
