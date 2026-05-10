import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 作物数据库类型定义
interface Crop {
  name: string;
  seasons: string[];       // 适宜季节
  tempRange: [number, number]; // 适宜温度范围
  waterNeed: string;       // 需水量：高/中/低
  soilTypes: string[];     // 适宜土壤类型
  terrainTypes: string[];  // 适宜地形
  revenuePerMu: number;    // 每亩收入（元）
  costPerMu: number;       // 每亩成本（元）
  difficulty: string;      // 种植难度：高/中/低
  cycleDays: number;       // 生长周期（天）
}

// 20种作物数据库
const CROP_DATABASE: Crop[] = [
  {
    name: '水稻',
    seasons: ['春季', '夏季'],
    tempRange: [20, 35],
    waterNeed: '高',
    soilTypes: ['黑土', '壤土', '黏土'],
    terrainTypes: ['平原', '盆地'],
    revenuePerMu: 1500,
    costPerMu: 800,
    difficulty: '中',
    cycleDays: 120,
  },
  {
    name: '小麦',
    seasons: ['秋季', '冬季', '春季'],
    tempRange: [10, 25],
    waterNeed: '中',
    soilTypes: ['黑土', '壤土', '黄土'],
    terrainTypes: ['平原', '丘陵', '盆地'],
    revenuePerMu: 1200,
    costPerMu: 600,
    difficulty: '低',
    cycleDays: 180,
  },
  {
    name: '玉米',
    seasons: ['春季', '夏季'],
    tempRange: [20, 33],
    waterNeed: '中',
    soilTypes: ['黑土', '壤土', '黄土'],
    terrainTypes: ['平原', '丘陵', '盆地'],
    revenuePerMu: 1300,
    costPerMu: 650,
    difficulty: '低',
    cycleDays: 100,
  },
  {
    name: '大豆',
    seasons: ['春季', '夏季'],
    tempRange: [18, 30],
    waterNeed: '中',
    soilTypes: ['黑土', '壤土', '红壤', '黄土'],
    terrainTypes: ['平原', '丘陵', '坡地'],
    revenuePerMu: 1100,
    costPerMu: 500,
    difficulty: '低',
    cycleDays: 100,
  },
  {
    name: '番茄',
    seasons: ['春季', '夏季', '秋季'],
    tempRange: [18, 30],
    waterNeed: '中',
    soilTypes: ['壤土', '黑土'],
    terrainTypes: ['平原', '丘陵'],
    revenuePerMu: 5000,
    costPerMu: 2500,
    difficulty: '中',
    cycleDays: 90,
  },
  {
    name: '黄瓜',
    seasons: ['春季', '夏季', '秋季'],
    tempRange: [18, 32],
    waterNeed: '高',
    soilTypes: ['壤土', '黑土'],
    terrainTypes: ['平原'],
    revenuePerMu: 4000,
    costPerMu: 2000,
    difficulty: '中',
    cycleDays: 60,
  },
  {
    name: '辣椒',
    seasons: ['春季', '夏季'],
    tempRange: [20, 32],
    waterNeed: '中',
    soilTypes: ['壤土', '黑土'],
    terrainTypes: ['平原', '丘陵'],
    revenuePerMu: 4500,
    costPerMu: 2000,
    difficulty: '中',
    cycleDays: 80,
  },
  {
    name: '西瓜',
    seasons: ['春季', '夏季'],
    tempRange: [22, 35],
    waterNeed: '中',
    soilTypes: ['砂土', '壤土'],
    terrainTypes: ['平原', '丘陵'],
    revenuePerMu: 3500,
    costPerMu: 1500,
    difficulty: '中',
    cycleDays: 90,
  },
  {
    name: '白菜',
    seasons: ['秋季', '冬季'],
    tempRange: [10, 22],
    waterNeed: '中',
    soilTypes: ['壤土', '黑土', '黏土'],
    terrainTypes: ['平原'],
    revenuePerMu: 2500,
    costPerMu: 1000,
    difficulty: '低',
    cycleDays: 60,
  },
  {
    name: '菠菜',
    seasons: ['春季', '秋季', '冬季'],
    tempRange: [8, 22],
    waterNeed: '中',
    soilTypes: ['壤土', '黑土', '黏土'],
    terrainTypes: ['平原'],
    revenuePerMu: 3000,
    costPerMu: 1200,
    difficulty: '低',
    cycleDays: 45,
  },
  {
    name: '大蒜',
    seasons: ['秋季', '冬季', '春季'],
    tempRange: [10, 25],
    waterNeed: '低',
    soilTypes: ['壤土', '砂土', '黄土'],
    terrainTypes: ['平原', '丘陵'],
    revenuePerMu: 3500,
    costPerMu: 1500,
    difficulty: '低',
    cycleDays: 200,
  },
  {
    name: '花生',
    seasons: ['春季', '夏季'],
    tempRange: [18, 30],
    waterNeed: '低',
    soilTypes: ['砂土', '壤土', '黄土'],
    terrainTypes: ['平原', '丘陵', '坡地'],
    revenuePerMu: 2000,
    costPerMu: 800,
    difficulty: '低',
    cycleDays: 110,
  },
  {
    name: '红薯',
    seasons: ['春季', '夏季'],
    tempRange: [18, 32],
    waterNeed: '低',
    soilTypes: ['砂土', '壤土', '红壤', '黄土'],
    terrainTypes: ['平原', '丘陵', '坡地', '山地'],
    revenuePerMu: 2500,
    costPerMu: 800,
    difficulty: '低',
    cycleDays: 120,
  },
  {
    name: '茶叶',
    seasons: ['春季', '秋季'],
    tempRange: [15, 28],
    waterNeed: '中',
    soilTypes: ['红壤', '壤土'],
    terrainTypes: ['山地', '丘陵', '坡地'],
    revenuePerMu: 6000,
    costPerMu: 3000,
    difficulty: '高',
    cycleDays: 365,
  },
  {
    name: '柑橘',
    seasons: ['春季', '秋季'],
    tempRange: [15, 30],
    waterNeed: '中',
    soilTypes: ['红壤', '壤土'],
    terrainTypes: ['丘陵', '山地', '坡地'],
    revenuePerMu: 8000,
    costPerMu: 3500,
    difficulty: '高',
    cycleDays: 365,
  },
  {
    name: '土豆',
    seasons: ['春季', '秋季'],
    tempRange: [12, 24],
    waterNeed: '中',
    soilTypes: ['壤土', '砂土', '黑土', '黄土'],
    terrainTypes: ['平原', '丘陵', '山地'],
    revenuePerMu: 2500,
    costPerMu: 1000,
    difficulty: '低',
    cycleDays: 80,
  },
  {
    name: '茄子',
    seasons: ['春季', '夏季', '秋季'],
    tempRange: [20, 32],
    waterNeed: '中',
    soilTypes: ['壤土', '黑土'],
    terrainTypes: ['平原'],
    revenuePerMu: 4000,
    costPerMu: 1800,
    difficulty: '中',
    cycleDays: 90,
  },
  {
    name: '生菜',
    seasons: ['春季', '秋季', '冬季'],
    tempRange: [10, 22],
    waterNeed: '中',
    soilTypes: ['壤土', '黑土'],
    terrainTypes: ['平原'],
    revenuePerMu: 3500,
    costPerMu: 1500,
    difficulty: '低',
    cycleDays: 40,
  },
  {
    name: '高粱',
    seasons: ['春季', '夏季'],
    tempRange: [20, 35],
    waterNeed: '低',
    soilTypes: ['砂土', '壤土', '黄土'],
    terrainTypes: ['平原', '丘陵', '坡地'],
    revenuePerMu: 1000,
    costPerMu: 400,
    difficulty: '低',
    cycleDays: 100,
  },
  {
    name: '莲藕',
    seasons: ['春季', '夏季'],
    tempRange: [22, 35],
    waterNeed: '高',
    soilTypes: ['黏土', '壤土'],
    terrainTypes: ['平原', '盆地'],
    revenuePerMu: 6000,
    costPerMu: 3000,
    difficulty: '中',
    cycleDays: 120,
  },
];

// 评分函数：季节匹配（30分）
function scoreSeason(crop: Crop, currentSeason: string): { score: number; reason: string } {
  if (crop.seasons.includes(currentSeason)) {
    return { score: 30, reason: `当前为${currentSeason}，是${crop.name}的适宜种植季节` };
  }
  // 检查相邻季节是否接近
  const seasonOrder = ['春季', '夏季', '秋季', '冬季'];
  const currentIndex = seasonOrder.indexOf(currentSeason);
  const adjacentSeasons = [
    seasonOrder[(currentIndex - 1 + 4) % 4],
    seasonOrder[(currentIndex + 1) % 4],
  ];
  if (crop.seasons.some((s) => adjacentSeasons.includes(s))) {
    return { score: 15, reason: `当前${currentSeason}临近${crop.name}的适宜季节，可提前准备` };
  }
  return { score: 3, reason: `当前${currentSeason}不是${crop.name}的适宜季节` };
}

// 评分函数：温度匹配（25分）
function scoreTemperature(crop: Crop, avgTemp: number): { score: number; reason: string } {
  const [minTemp, maxTemp] = crop.tempRange;
  const range = maxTemp - minTemp;

  if (avgTemp >= minTemp && avgTemp <= maxTemp) {
    // 在范围内，越接近中点分数越高
    const midPoint = (minTemp + maxTemp) / 2;
    const deviation = Math.abs(avgTemp - midPoint) / (range / 2);
    const score = Math.round(25 - deviation * 8);
    return { score: Math.max(score, 17), reason: `平均温度${avgTemp}°C在${crop.name}适宜范围(${minTemp}-${maxTemp}°C)内` };
  }

  // 在范围外但不太远
  const distance = avgTemp < minTemp ? minTemp - avgTemp : avgTemp - maxTemp;
  if (distance <= 5) {
    return { score: 12, reason: `平均温度${avgTemp}°C略偏离${crop.name}适宜范围(${minTemp}-${maxTemp}°C)` };
  }
  return { score: 2, reason: `平均温度${avgTemp}°C远超${crop.name}适宜范围(${minTemp}-${maxTemp}°C)` };
}

// 评分函数：土壤匹配（20分）
function scoreSoil(crop: Crop, soilType: string): { score: number; reason: string } {
  if (crop.soilTypes.includes(soilType)) {
    return { score: 20, reason: `${soilType}非常适合种植${crop.name}` };
  }
  // 检查土壤兼容性
  const compatibleSoils: Record<string, string[]> = {
    '黑土': ['壤土'],
    '壤土': ['黑土', '黏土'],
    '黏土': ['壤土'],
    '红壤': ['壤土', '黄土'],
    '黄土': ['壤土', '砂土'],
    '砂土': ['壤土', '黄土'],
  };
  if (compatibleSoils[soilType]?.some((s) => crop.soilTypes.includes(s))) {
    return { score: 10, reason: `${soilType}基本适合种植${crop.name}，可适当改良` };
  }
  return { score: 3, reason: `${soilType}不太适合种植${crop.name}，需大幅改良` };
}

// 评分函数：地形匹配（15分）
function scoreTerrain(crop: Crop, terrain: string): { score: number; reason: string } {
  if (crop.terrainTypes.includes(terrain)) {
    return { score: 15, reason: `${terrain}地形适合种植${crop.name}` };
  }
  // 检查兼容地形
  const compatibleTerrains: Record<string, string[]> = {
    '平原': ['盆地', '丘陵'],
    '山地': ['丘陵', '坡地'],
    '丘陵': ['平原', '坡地', '山地'],
    '坡地': ['丘陵', '山地'],
    '盆地': ['平原'],
  };
  if (compatibleTerrains[terrain]?.some((t) => crop.terrainTypes.includes(t))) {
    return { score: 8, reason: `${terrain}地形基本适合种植${crop.name}` };
  }
  return { score: 2, reason: `${terrain}地形不适合种植${crop.name}` };
}

// 评分函数：水分匹配（10分）
function scoreWater(crop: Crop, totalPrecip: number): { score: number; reason: string } {
  const waterNeedMap: Record<string, { min: number; max: number }> = {
    '高': { min: 400, max: 1200 },
    '中': { min: 250, max: 800 },
    '低': { min: 100, max: 500 },
  };

  const range = waterNeedMap[crop.waterNeed];
  if (!range) return { score: 5, reason: '水分需求信息不足' };

  if (totalPrecip >= range.min && totalPrecip <= range.max) {
    return { score: 10, reason: `降水量${totalPrecip}mm满足${crop.name}的${crop.waterNeed}需水要求` };
  }

  if (totalPrecip < range.min) {
    const deficit = range.min - totalPrecip;
    if (deficit <= 100) {
      return { score: 6, reason: `降水量略低于${crop.name}需求，需适当补充灌溉` };
    }
    return { score: 2, reason: `降水量严重不足${crop.name}需求，需大量灌溉` };
  }

  // 降水过多
  if (totalPrecip <= range.max + 200) {
    return { score: 5, reason: `降水量偏多，注意排水防涝` };
  }
  return { score: 1, reason: `降水量过多，不适合种植${crop.name}` };
}

// AI推荐加分（15分）
function scoreAIRecommendation(crop: Crop, aiAnalysis?: { suitableCrops?: string[] }): { score: number; reason: string } {
  if (!aiAnalysis?.suitableCrops) {
    return { score: 0, reason: '无AI分析数据' };
  }

  if (aiAnalysis.suitableCrops.includes(crop.name)) {
    return { score: 15, reason: `AI分析推荐种植${crop.name}` };
  }
  return { score: 0, reason: 'AI分析未推荐此作物' };
}

// 天气推荐加分（10分）
function scoreWeatherRecommendation(crop: Crop, weatherInfo?: { suitableCrops?: string[] }): { score: number; reason: string } {
  if (!weatherInfo?.suitableCrops) {
    return { score: 0, reason: '无天气分析数据' };
  }

  if (weatherInfo.suitableCrops.includes(crop.name)) {
    return { score: 10, reason: `根据天气条件推荐种植${crop.name}` };
  }
  return { score: 0, reason: '天气条件未推荐此作物' };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { landInfo, weatherInfo, aiAnalysis } = body;

    if (!landInfo) {
      return NextResponse.json(
        { error: '缺少必要参数：landInfo' },
        { status: 400 }
      );
    }

    const { soilType = '壤土', terrain = '平原', landType = '旱地' } = landInfo;
    const currentSeason = weatherInfo?.summary?.season || getSeasonByMonth(new Date().getMonth() + 1);
    const avgTemp = weatherInfo?.summary?.avgTemperature || 20;
    const totalPrecip = weatherInfo?.summary?.totalPrecipitation || 400;

    // 对每种作物进行评分
    const scored = CROP_DATABASE.map((crop) => {
      const seasonScore = scoreSeason(crop, currentSeason);
      const tempScore = scoreTemperature(crop, avgTemp);
      const soilScore = scoreSoil(crop, soilType);
      const terrainScore = scoreTerrain(crop, terrain);
      const waterScore = scoreWater(crop, totalPrecip);
      const aiScore = scoreAIRecommendation(crop, aiAnalysis);
      const weatherScore = scoreWeatherRecommendation(crop, weatherInfo?.summary);

      const totalScore = Math.min(
        seasonScore.score +
        tempScore.score +
        soilScore.score +
        terrainScore.score +
        waterScore.score +
        aiScore.score +
        weatherScore.score,
        100
      );

      const matchLevel = totalScore >= 70 ? 'strong' : totalScore >= 40 ? 'medium' : 'weak';

      const reasons = [
        seasonScore.reason,
        tempScore.reason,
        soilScore.reason,
        terrainScore.reason,
        waterScore.reason,
        aiScore.reason,
        weatherScore.reason,
      ].filter((r) => r && !r.startsWith('无') && !r.startsWith('AI分析未') && !r.startsWith('天气条件未'));

      return {
        name: crop.name,
        score: totalScore,
        matchLevel,
        reasons,
        season: crop.seasons.join('/'),
        cycleDays: crop.cycleDays,
        difficulty: crop.difficulty,
        waterNeed: crop.waterNeed,
        revenuePerMu: crop.revenuePerMu,
        costPerMu: crop.costPerMu,
        profitPerMu: crop.revenuePerMu - crop.costPerMu,
        totalProfit: (crop.revenuePerMu - crop.costPerMu) * Math.floor(365 / crop.cycleDays),
      };
    });

    // 按分数排序
    scored.sort((a, b) => b.score - a.score);

    // 添加排名
    const recommendations = scored.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    // 生成汇总
    const topCrops = recommendations.slice(0, 5).map((r) => r.name);
    const bestChoice = recommendations[0];
    const avgScore = Math.round(
      recommendations.reduce((sum: number, r: typeof recommendations[0]) => sum + r.score, 0) /
      recommendations.length
    );

    const weatherAdvice = generateWeatherAdvice(currentSeason, avgTemp, totalPrecip);
    const generalAdvice = generateGeneralAdvice(soilType, terrain, landType);

    const summary = {
      bestChoice: {
        name: bestChoice.name,
        score: bestChoice.score,
        matchLevel: bestChoice.matchLevel,
        profitPerMu: bestChoice.profitPerMu,
      },
      topCrops,
      totalOptions: recommendations.length,
      avgScore,
      weatherAdvice,
      generalAdvice,
    };

    return NextResponse.json({
      recommendations,
      summary,
    });
  } catch (error) {
    console.error('推荐API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}

// 根据月份获取季节
function getSeasonByMonth(month: number): string {
  if (month >= 3 && month <= 5) return '春季';
  if (month >= 6 && month <= 8) return '夏季';
  if (month >= 9 && month <= 11) return '秋季';
  return '冬季';
}

// 生成天气相关建议
function generateWeatherAdvice(season: string, avgTemp: number, totalPrecip: number): string[] {
  const advice: string[] = [];

  advice.push(`当前季节为${season}，平均温度${avgTemp}°C，预计降水量${totalPrecip}mm`);

  if (season === '春季') {
    advice.push('春季气温回升，适合播种大部分作物，注意倒春寒');
  } else if (season === '夏季') {
    advice.push('夏季高温多雨，注意防暑降温和田间排水');
  } else if (season === '秋季') {
    advice.push('秋季天高气爽，适合收获和秋播作物');
  } else {
    advice.push('冬季气温较低，注意防寒保暖，适合种植耐寒作物');
  }

  if (avgTemp > 30) {
    advice.push('温度偏高，建议选择耐热作物或采取遮阳降温措施');
  } else if (avgTemp < 10) {
    advice.push('温度偏低，建议选择耐寒作物或使用温室大棚');
  }

  if (totalPrecip > 600) {
    advice.push('降水量较充沛，注意田间排水，防止涝害');
  } else if (totalPrecip < 200) {
    advice.push('降水量偏少，建议做好灌溉准备，优先选择耐旱作物');
  }

  return advice;
}

// 生成通用建议
function generateGeneralAdvice(soilType: string, terrain: string, landType: string): string[] {
  const advice: string[] = [];

  advice.push(`您的土地类型为${landType}，土壤类型为${soilType}，地形为${terrain}`);

  if (soilType === '黑土' || soilType === '壤土') {
    advice.push('土壤条件良好，适合种植多种作物');
  } else if (soilType === '砂土') {
    advice.push('砂土保水保肥能力差，建议增施有机肥，选择耐旱作物');
  } else if (soilType === '黏土') {
    advice.push('黏土透气性差，建议深翻改良，选择耐涝作物');
  } else if (soilType === '红壤') {
    advice.push('红壤偏酸性，建议施用石灰改良，适合种植茶树等喜酸作物');
  }

  if (terrain === '平原') {
    advice.push('平原地区适合大规模种植和机械化作业');
  } else if (terrain === '山地' || terrain === '坡地') {
    advice.push('坡地种植注意水土保持，建议修建梯田');
  }

  advice.push('建议结合当地市场需求选择作物品种，提高经济效益');
  advice.push('推荐采用科学种植管理技术，合理施肥用药');

  return advice;
}
