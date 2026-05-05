import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { imageBase64, landType, soilType, terrain } = await request.json();

    // 如果没有提供图片，返回手动输入的分析
    if (!imageBase64) {
      return NextResponse.json({
        source: "manual",
        analysis: {
          landType: landType || "未知",
          soilType: soilType || "未知",
          terrain: terrain || "未知",
          fertility: estimateFertility(soilType),
          drainage: estimateDrainage(terrain, soilType),
          suitableCrops: getSuitableCrops(soilType, terrain),
          suggestions: getSuggestions(soilType, terrain, landType),
        },
      });
    }

    // 有图片时，使用通义千问视觉模型分析
    const apiKey = process.env.DASHSCOPE_API_KEY;

    if (!apiKey) {
      // 没有配置API Key时，使用基于手动输入的分析
      return NextResponse.json({
        source: "manual_fallback",
        message: "AI分析功能需要配置API Key，当前使用手动输入分析",
        analysis: {
          landType: landType || "耕地",
          soilType: soilType || "壤土",
          terrain: terrain || "平原",
          fertility: estimateFertility(soilType),
          drainage: estimateDrainage(terrain, soilType),
          suitableCrops: getSuitableCrops(soilType, terrain),
          suggestions: getSuggestions(soilType, terrain, landType),
        },
      });
    }

    const prompt = `你是一位专业的农业土壤分析专家。请分析这张土地/土壤照片，以JSON格式返回分析结果。
请严格按以下JSON格式返回，不要包含其他文字：
{
  "soilColor": "土壤颜色描述",
  "soilTexture": "土壤质地（如砂土、壤土、黏土）",
  "soilMoisture": "土壤湿度评估（干燥/适中/潮湿）",
  "vegetation": "现有植被描述",
  "landType": "土地类型（水田/旱地/果园/菜地/荒地）",
  "terrain": "地形（平原/丘陵/山地/坡地）",
  "fertility": "肥力评估（高/中/低）",
  "drainage": "排水性评估（好/中/差）",
  "suitableCrops": ["适合种植的作物1", "作物2", "作物3"],
  "improvementSuggestions": ["改良建议1", "建议2"]
}`;

    const res = await fetch(
      "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "qwen-vl-max",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: imageBase64 },
                },
                {
                  type: "text",
                  text: prompt,
                },
              ],
            },
          ],
          max_tokens: 1000,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("通义千问API错误:", errText);
      // 降级到手动分析
      return NextResponse.json({
        source: "manual_fallback",
        message: "AI分析暂时不可用，已使用手动输入分析",
        analysis: {
          landType: landType || "耕地",
          soilType: soilType || "壤土",
          terrain: terrain || "平原",
          fertility: estimateFertility(soilType),
          drainage: estimateDrainage(terrain, soilType),
          suitableCrops: getSuitableCrops(soilType, terrain),
          suggestions: getSuggestions(soilType, terrain, landType),
        },
      });
    }

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content || "";

    // 尝试解析JSON
    let aiAnalysis;
    try {
      // 提取JSON部分
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiAnalysis = JSON.parse(jsonMatch[0]);
      }
    } catch {
      aiAnalysis = null;
    }

    if (aiAnalysis) {
      return NextResponse.json({
        source: "ai",
        analysis: {
          landType: aiAnalysis.landType || landType || "耕地",
          soilType: aiAnalysis.soilTexture || soilType || "壤土",
          terrain: aiAnalysis.terrain || terrain || "平原",
          fertility: aiAnalysis.fertility || "中",
          drainage: aiAnalysis.drainage || "中",
          suitableCrops: aiAnalysis.suitableCrops || getSuitableCrops(soilType, terrain),
          suggestions: aiAnalysis.improvementSuggestions || getSuggestions(soilType, terrain, landType),
          aiDetails: {
            soilColor: aiAnalysis.soilColor,
            soilMoisture: aiAnalysis.soilMoisture,
            vegetation: aiAnalysis.vegetation,
          },
        },
      });
    }

    // AI返回无法解析时降级
    return NextResponse.json({
      source: "ai_raw",
      rawContent: content,
      analysis: {
        landType: landType || "耕地",
        soilType: soilType || "壤土",
        terrain: terrain || "平原",
        fertility: estimateFertility(soilType),
        drainage: estimateDrainage(terrain, soilType),
        suitableCrops: getSuitableCrops(soilType, terrain),
        suggestions: getSuggestions(soilType, terrain, landType),
      },
    });
  } catch (error) {
    console.error("分析API错误:", error);
    return NextResponse.json({ error: "分析失败" }, { status: 500 });
  }
}

function estimateFertility(soilType?: string): string {
  const map: Record<string, string> = {
    黑土: "高",
    壤土: "高",
    黏土: "中",
    砂土: "低",
    砂壤土: "中",
    黄土: "中",
    红壤: "中",
  };
  return map[soilType || ""] || "中";
}

function estimateDrainage(terrain?: string, soilType?: string): string {
  if (terrain === "山地" || terrain === "坡地") return "好";
  if (soilType === "砂土") return "好";
  if (soilType === "黏土") return "差";
  return "中";
}

function getSuitableCrops(soilType?: string, terrain?: string): string[] {
  const crops = new Set<string>();

  if (!soilType || soilType === "壤土") {
    crops.add("小麦").add("玉米").add("大豆").add("番茄").add("白菜");
  }
  if (soilType === "黑土") {
    crops.add("大豆").add("玉米").add("水稻").add("高粱").add("甜菜");
  }
  if (soilType === "砂土") {
    crops.add("花生").add("西瓜").add("红薯").add("棉花").add("谷子");
  }
  if (soilType === "黏土") {
    crops.add("水稻").add("莲藕").add("小麦").add("油菜");
  }
  if (soilType === "红壤") {
    crops.add("茶叶").add("柑橘").add("甘蔗").add("烟草").add("油菜");
  }
  if (terrain === "山地" || terrain === "丘陵") {
    crops.add("茶叶").add("果树").add("中药材").add("竹子");
  }

  return Array.from(crops).slice(0, 8);
}

function getSuggestions(soilType?: string, terrain?: string, landType?: string): string[] {
  const suggestions: string[] = [];

  if (soilType === "砂土") {
    suggestions.push("砂土保水保肥能力差，建议增施有机肥，采用滴灌方式");
    suggestions.push("适合种植耐旱作物，注意少量多次施肥");
  }
  if (soilType === "黏土") {
    suggestions.push("黏土透气性差，建议深翻改土，掺入砂质改良");
    suggestions.push("注意排水，避免积水导致根部病害");
  }
  if (soilType === "红壤") {
    suggestions.push("红壤偏酸性，建议施用石灰调节pH值");
    suggestions.push("增施有机肥和磷肥，提高土壤肥力");
  }
  if (terrain === "坡地" || terrain === "山地") {
    suggestions.push("坡地种植建议等高线耕作，防止水土流失");
    suggestions.push("可修筑梯田，选择根系发达的作物");
  }
  if (landType === "水田") {
    suggestions.push("水田注意合理灌溉，适时晒田促进根系生长");
  }

  if (suggestions.length === 0) {
    suggestions.push("建议进行土壤检测，了解具体养分含量");
    suggestions.push("根据季节选择适宜作物，合理轮作提高地力");
    suggestions.push("增施有机肥，改善土壤结构");
  }

  return suggestions;
}
