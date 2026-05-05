import { NextRequest, NextResponse } from "next/server";

interface RecommendRequest {
  landInfo: {
    area: number;
    landType?: string;
    soilType?: string;
    terrain?: string;
    fertility?: string;
    drainage?: string;
  };
  weatherInfo: {
    avgTemperature: number;
    totalPrecipitation: number;
    avgSoilMoisture: number | null;
    season: string;
    suitableCrops: string[];
  };
  aiAnalysis?: {
    suitableCrops?: string[];
    suggestions?: string[];
  };
}

// 作物数据库
const cropDatabase = [
  {
    name: "水稻",
    seasons: ["春季", "夏季"],
    tempRange: [20, 38],
    waterNeed: "高",
    soilTypes: ["黏土", "壤土", "黑土"],
    terrainTypes: ["平原"],
    revenuePerMu: 1200,
    costPerMu: 800,
    difficulty: "中",
    cycleDays: 120,
  },
  {
    name: "小麦",
    seasons: ["秋季", "冬季", "春季"],
    tempRange: [3, 25],
    waterNeed: "中",
    soilTypes: ["壤土", "黏土", "黄土"],
    terrainTypes: ["平原", "丘陵"],
    revenuePerMu: 900,
    costPerMu: 500,
    difficulty: "低",
    cycleDays: 180,
  },
  {
    name: "玉米",
    seasons: ["春季", "夏季"],
    tempRange: [16, 35],
    waterNeed: "中",
    soilTypes: ["壤土", "黑土", "砂壤土"],
    terrainTypes: ["平原", "丘陵"],
    revenuePerMu: 1100,
    costPerMu: 600,
    difficulty: "低",
    cycleDays: 100,
  },
  {
    name: "大豆",
    seasons: ["春季", "夏季"],
    tempRange: [15, 30],
    waterNeed: "中",
    soilTypes: ["黑土", "壤土", "黄土"],
    terrainTypes: ["平原", "丘陵"],
    revenuePerMu: 800,
    costPerMu: 400,
    difficulty: "低",
    cycleDays: 90,
  },
  {
    name: "番茄",
    seasons: ["春季", "夏季"],
    tempRange: [18, 32],
    waterNeed: "中",
    soilTypes: ["壤土", "砂壤土"],
    terrainTypes: ["平原"],
    revenuePerMu: 5000,
    costPerMu: 2500,
    difficulty: "中",
    cycleDays: 90,
  },
  {
    name: "黄瓜",
    seasons: ["春季", "夏季"],
    tempRange: [18, 35],
    waterNeed: "高",
    soilTypes: ["壤土", "砂壤土"],
    terrainTypes: ["平原"],
    revenuePerMu: 4000,
    costPerMu: 2000,
    difficulty: "中",
    cycleDays: 60,
  },
  {
    name: "辣椒",
    seasons: ["春季", "夏季"],
    tempRange: [15, 35],
    waterNeed: "中",
    soilTypes: ["壤土", "砂壤土"],
    terrainTypes: ["平原", "丘陵"],
    revenuePerMu: 3500,
    costPerMu: 1500,
    difficulty: "中",
    cycleDays: 80,
  },
  {
    name: "西瓜",
    seasons: ["春季", "夏季"],
    tempRange: [20, 35],
    waterNeed: "中",
    soilTypes: ["砂土", "砂壤土", "壤土"],
    terrainTypes: ["平原"],
    revenuePerMu: 4500,
    costPerMu: 2000,
    difficulty: "中",
    cycleDays: 90,
  },
  {
    name: "白菜",
    seasons: ["秋季", "冬季"],
    tempRange: [5, 25],
    waterNeed: "中",
    soilTypes: ["壤土", "黏土"],
    terrainTypes: ["平原"],
    revenuePerMu: 2500,
    costPerMu: 800,
    difficulty: "低",
    cycleDays: 60,
  },
  {
    name: "菠菜",
    seasons: ["秋季", "冬季", "春季"],
    tempRange: [5, 25],
    waterNeed: "中",
    soilTypes: ["壤土", "砂壤土"],
    terrainTypes: ["平原"],
    revenuePerMu: 2000,
    costPerMu: 600,
    difficulty: "低",
    cycleDays: 40,
  },
  {
    name: "大蒜",
    seasons: ["秋季", "冬季"],
    tempRange: [5, 20],
    waterNeed: "中",
    soilTypes: ["壤土", "砂壤土"],
    terrainTypes: ["平原"],
    revenuePerMu: 3000,
    costPerMu: 1200,
    difficulty: "低",
    cycleDays: 200,
  },
  {
    name: "花生",
    seasons: ["春季", "夏季"],
    tempRange: [18, 32],
    waterNeed: "中",
    soilTypes: ["砂土", "砂壤土"],
    terrainTypes: ["平原", "丘陵"],
    revenuePerMu: 1800,
    costPerMu: 700,
    difficulty: "低",
    cycleDays: 120,
  },
  {
    name: "红薯",
    seasons: ["春季", "夏季"],
    tempRange: [15, 30],
    waterNeed: "中",
    soilTypes: ["砂土", "砂壤土", "壤土"],
    terrainTypes: ["平原", "丘陵"],
    revenuePerMu: 2000,
    costPerMu: 600,
    difficulty: "低",
    cycleDays: 120,
  },
  {
    name: "茶叶",
    seasons: ["春季", "秋季"],
    tempRange: [10, 28],
    waterNeed: "高",
    soilTypes: ["红壤", "壤土"],
    terrainTypes: ["丘陵", "山地"],
    revenuePerMu: 6000,
    costPerMu: 2500,
    difficulty: "高",
    cycleDays: 365,
  },
  {
    name: "柑橘",
    seasons: ["春季"],
    tempRange: [12, 32],
    waterNeed: "中",
    soilTypes: ["红壤", "壤土"],
    terrainTypes: ["丘陵", "山地"],
    revenuePerMu: 8000,
    costPerMu: 3500,
    difficulty: "高",
    cycleDays: 365,
  },
  {
    name: "土豆",
    seasons: ["春季", "秋季"],
    tempRange: [10, 25],
    waterNeed: "中",
    soilTypes: ["壤土", "砂壤土"],
    terrainTypes: ["平原", "丘陵"],
    revenuePerMu: 2200,
    costPerMu: 900,
    difficulty: "低",
    cycleDays: 80,
  },
  {
    name: "茄子",
    seasons: ["春季", "夏季"],
    tempRange: [18, 32],
    waterNeed: "中",
    soilTypes: ["壤土", "砂壤土"],
    terrainTypes: ["平原"],
    revenuePerMu: 3500,
    costPerMu: 1500,
    difficulty: "中",
    cycleDays: 80,
  },
  {
    name: "生菜",
    seasons: ["春季", "秋季", "冬季"],
    tempRange: [10, 25],
    waterNeed: "中",
    soilTypes: ["壤土", "砂壤土"],
    terrainTypes: ["平原"],
    revenuePerMu: 3000,
    costPerMu: 1000,
    difficulty: "低",
    cycleDays: 35,
  },
  {
    name: "高粱",
    seasons: ["春季", "夏季"],
    tempRange: [20, 35],
    waterNeed: "低",
    soilTypes: ["砂土", "壤土"],
    terrainTypes: ["平原", "丘陵"],
    revenuePerMu: 900,
    costPerMu: 400,
    difficulty: "低",
    cycleDays: 100,
  },
  {
    name: "莲藕",
    seasons: ["春季", "夏季"],
    tempRange: [18, 32],
    waterNeed: "高",
    soilTypes: ["黏土", "壤土"],
    terrainTypes: ["平原"],
    revenuePerMu: 5000,
    costPerMu: 2000,
    difficulty: "中",
    cycleDays: 120,
  },
];

export async function POST(request: NextRequest) {
  try {
    const body: RecommendRequest = await request.json();
    const { landInfo, weatherInfo, aiAnalysis } = body;

    // 评分并排序所有作物
    const scored = cropDatabase.map((crop) => {
      let score = 0;
      let reasons: string[] = [];

      // 季节匹配（权重30）
      if (crop.seasons.includes(weatherInfo.season)) {
        score += 30;
        reasons.push(`${weatherInfo.season}适合种植`);
      } else {
        score -= 20;
        reasons.push(`${weatherInfo.season}非最佳种植季节`);
      }

      // 温度匹配（权重25）
      if (
        weatherInfo.avgTemperature >= crop.tempRange[0] &&
        weatherInfo.avgTemperature <= crop.tempRange[1]
      ) {
        score += 25;
        reasons.push(`当前温度(${weatherInfo.avgTemperature}°C)适宜`);
      } else if (
        weatherInfo.avgTemperature >= crop.tempRange[0] - 5 &&
        weatherInfo.avgTemperature <= crop.tempRange[1] + 5
      ) {
        score += 10;
        reasons.push(`温度基本适宜，需注意防护`);
      } else {
        score -= 15;
        reasons.push(`当前温度不适宜`);
      }

      // 土壤类型匹配（权重20）
      if (landInfo.soilType && crop.soilTypes.includes(landInfo.soilType)) {
        score += 20;
        reasons.push(`${landInfo.soilType}适合该作物`);
      } else if (landInfo.soilType) {
        score += 5;
        reasons.push(`${landInfo.soilType}非最佳土壤，可改良`);
      }

      // 地形匹配（权重15）
      if (landInfo.terrain && crop.terrainTypes.includes(landInfo.terrain)) {
        score += 15;
        reasons.push(`${landInfo.terrain}地形适宜`);
      } else if (landInfo.terrain) {
        score -= 5;
      }

      // 水分需求匹配（权重10）
      if (weatherInfo.totalPrecipitation < 10 && crop.waterNeed === "低") {
        score += 10;
        reasons.push("当前少雨，耐旱作物优势明显");
      } else if (weatherInfo.totalPrecipitation > 50 && crop.waterNeed === "高") {
        score += 10;
        reasons.push("当前多雨，喜水作物优势明显");
      } else if (weatherInfo.totalPrecipitation < 10 && crop.waterNeed === "高") {
        score -= 10;
        reasons.push("当前少雨，需额外灌溉");
      }

      // AI分析加分
      if (aiAnalysis?.suitableCrops?.includes(crop.name)) {
        score += 15;
        reasons.push("AI分析推荐");
      }

      // 天气推荐加分
      if (weatherInfo.suitableCrops.includes(crop.name)) {
        score += 10;
      }

      // 计算预期收益
      const profitPerMu = crop.revenuePerMu - crop.costPerMu;
      const totalProfit = profitPerMu * landInfo.area;

      return {
        ...crop,
        score: Math.max(0, score),
        reasons,
        profitPerMu,
        totalProfit,
        matchLevel:
          score >= 70
            ? "strong"
            : score >= 40
              ? "medium"
              : "weak",
      };
    });

    // 按评分排序
    scored.sort((a, b) => b.score - a.score);

    // 返回前10个推荐
    const recommendations = scored.slice(0, 10).map((crop, index) => ({
      rank: index + 1,
      name: crop.name,
      score: crop.score,
      matchLevel: crop.matchLevel,
      reasons: crop.reasons,
      season: crop.seasons.join("/"),
      cycleDays: crop.cycleDays,
      difficulty: crop.difficulty,
      waterNeed: crop.waterNeed,
      revenuePerMu: crop.revenuePerMu,
      costPerMu: crop.costPerMu,
      profitPerMu: crop.profitPerMu,
      totalProfit: crop.totalProfit,
    }));

    // 综合建议
    const topCrops = recommendations.filter((r) => r.matchLevel === "strong");
    const summary = {
      bestChoice: recommendations[0]?.name || "暂无推荐",
      topCrops: topCrops.map((c) => c.name),
      totalOptions: recommendations.length,
      avgScore:
        recommendations.length > 0
          ? Math.round(
              recommendations.reduce((s, c) => s + c.score, 0) /
                recommendations.length
            )
          : 0,
      weatherAdvice: getWeatherAdvice(weatherInfo),
      generalAdvice: getGeneralAdvice(landInfo, weatherInfo),
    };

    return NextResponse.json({ recommendations, summary });
  } catch (error) {
    console.error("推荐API错误:", error);
    return NextResponse.json({ error: "推荐失败" }, { status: 500 });
  }
}

function getWeatherAdvice(weather: RecommendRequest["weatherInfo"]): string[] {
  const advice: string[] = [];
  if (weather.avgTemperature > 35) {
    advice.push("近期气温偏高，建议选择耐热作物或做好遮阳降温");
  }
  if (weather.avgTemperature < 10) {
    advice.push("近期气温偏低，建议选择耐寒作物或使用温室大棚");
  }
  if (weather.totalPrecipitation > 80) {
    advice.push("近期降雨较多，注意排水防涝，避免种植不耐涝作物");
  }
  if (weather.totalPrecipitation < 5) {
    advice.push("近期降雨偏少，注意灌溉补水，优先选择耐旱作物");
  }
  if (weather.avgSoilMoisture && weather.avgSoilMoisture < 0.15) {
    advice.push("土壤湿度偏低，建议先灌溉再播种");
  }
  if (advice.length === 0) {
    advice.push("近期天气条件良好，适合大部分作物种植");
  }
  return advice;
}

function getGeneralAdvice(
  land: RecommendRequest["landInfo"],
  weather: RecommendRequest["weatherInfo"]
): string[] {
  const advice: string[] = [];
  advice.push(
    `您有${land.area}亩${land.landType || "耕地"}，建议根据地块条件合理分区种植`
  );
  if (land.area > 10) {
    advice.push("面积较大，建议采用机械化作业，降低人工成本");
    advice.push("可考虑主粮+经济作物搭配种植，分散风险");
  }
  if (land.area <= 3) {
    advice.push("面积较小，建议种植高附加值蔬菜或特色作物");
  }
  advice.push("建议关注市场行情，避免跟风种植导致滞销");
  return advice;
}
