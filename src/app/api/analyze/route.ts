import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 估算土壤肥力
function estimateFertility(soilType: string): string {
  const fertilityMap: Record<string, string> = {
    '黑土': '高',
    '壤土': '高',
    '黏土': '中',
    '红壤': '中',
    '黄土': '中',
    '砂土': '低',
  };
  return fertilityMap[soilType] || '中';
}

// 估算排水性
function estimateDrainage(terrain: string, soilType: string): string {
  const goodDrainageTerrains = ['山地', '坡地'];
  const badDrainageSoils = ['黏土'];

  if (goodDrainageTerrains.includes(terrain) || soilType === '砂土') {
    return '好';
  }
  if (badDrainageSoils.includes(soilType)) {
    return '差';
  }
  return '中';
}

// 根据土壤和地形返回适合作物
function getSuitableCrops(soilType: string, terrain: string): string[] {
  const crops: string[] = [];

  // 根据土壤类型推荐
  const soilCropMap: Record<string, string[]> = {
    '黑土': ['水稻', '玉米', '大豆', '小麦', '高粱', '白菜', '菠菜', '土豆', '红薯'],
    '壤土': ['番茄', '黄瓜', '辣椒', '茄子', '白菜', '菠菜', '生菜', '大蒜', '花生', '西瓜'],
    '黏土': ['水稻', '莲藕', '白菜', '菠菜'],
    '红壤': ['茶叶', '柑橘', '红薯', '花生', '大豆'],
    '黄土': ['小麦', '玉米', '高粱', '土豆', '花生', '红薯', '大豆'],
    '砂土': ['西瓜', '花生', '红薯', '大豆', '土豆'],
  };

  if (soilCropMap[soilType]) {
    crops.push(...soilCropMap[soilType]);
  }

  // 根据地形推荐
  if (terrain === '平原') {
    crops.push('水稻', '小麦', '玉米', '大豆', '白菜', '菠菜', '生菜');
  } else if (terrain === '山地') {
    crops.push('茶叶', '柑橘', '红薯', '大豆');
  } else if (terrain === '坡地') {
    crops.push('茶叶', '红薯', '花生', '大豆', '果树');
  } else if (terrain === '丘陵') {
    crops.push('茶叶', '柑橘', '花生', '红薯', '大豆', '玉米');
  } else if (terrain === '盆地') {
    crops.push('水稻', '小麦', '玉米', '莲藕', '蔬菜');
  }

  // 去重
  return Array.from(new Set(crops));
}

// 返回改良建议
function getSuggestions(soilType: string, terrain: string, landType: string): string[] {
  const suggestions: string[] = [];

  // 土壤改良建议
  if (soilType === '砂土') {
    suggestions.push('建议增施有机肥，提高土壤保水保肥能力');
    suggestions.push('可添加黏土或泥炭改良土壤结构');
    suggestions.push('建议采用滴灌方式，减少水分流失');
  } else if (soilType === '黏土') {
    suggestions.push('建议深翻土壤，改善透气性和排水性');
    suggestions.push('可掺入砂土或有机质改良土壤质地');
    suggestions.push('注意避免在大雨后进行田间作业');
  } else if (soilType === '红壤') {
    suggestions.push('建议施用石灰或白云石粉调节土壤酸度');
    suggestions.push('增施有机肥和磷肥，提高土壤肥力');
    suggestions.push('适合种植耐酸作物如茶叶、红薯等');
  } else if (soilType === '黄土') {
    suggestions.push('建议增施有机肥，改善土壤结构和肥力');
    suggestions.push('注意水土保持，防止土壤侵蚀');
    suggestions.push('可采用等高种植或梯田方式减少水土流失');
  }

  // 地形相关建议
  if (terrain === '山地' || terrain === '坡地') {
    suggestions.push('建议修建梯田或等高线种植，防止水土流失');
    suggestions.push('山地种植注意选择耐旱、根系发达的作物');
    suggestions.push('建议建设蓄水设施，保障灌溉水源');
  } else if (terrain === '平原') {
    suggestions.push('平原地区适合大规模机械化作业');
    suggestions.push('注意合理轮作，避免连作障碍');
  } else if (terrain === '盆地') {
    suggestions.push('盆地注意通风和排水，防止病虫害滋生');
    suggestions.push('可利用盆地小气候特点发展特色种植');
  }

  // 土地类型建议
  if (landType === '旱地') {
    suggestions.push('旱地建议选择耐旱作物品种');
    suggestions.push('可采用地膜覆盖、秸秆覆盖等保墒措施');
  } else if (landType === '水田') {
    suggestions.push('水田注意合理灌溉，避免长期深水浸泡');
    suggestions.push('建议定期晒田，促进根系生长');
  } else if (landType === '菜地') {
    suggestions.push('菜地建议合理施肥，注意氮磷钾配比');
    suggestions.push('建议轮作不同科属蔬菜，减少病虫害');
  }

  // 通用建议
  suggestions.push('建议定期进行土壤检测，科学施肥');
  suggestions.push('推荐使用有机肥与化肥配合施用，提高土壤质量');

  return suggestions;
}

// 调用通义千问视觉API分析
async function analyzeWithAI(imageBase64: string): Promise<Record<string, string> | null> {
  const apiKey = process.env.DASHSCOPE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(
      'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'qwen-vl-plus',
          messages: [
            {
              role: 'system',
              content:
                '你是一个农业土壤和土地分析专家。请根据图片分析土地情况，返回JSON格式结果。包含以下字段：landType（土地类型：旱地/水田/菜地/果园/林地/荒地），soilType（土壤类型：黑土/壤土/黏土/红壤/黄土/砂土），terrain（地形：平原/山地/丘陵/坡地/盆地），fertility（肥力评估：高/中/低），drainage（排水性：好/中/差），description（详细描述）。只返回JSON，不要其他文字。',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: imageBase64.startsWith('data:')
                      ? imageBase64
                      : `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
                {
                  type: 'text',
                  text: '请分析这张图片中的土地和土壤情况，给出详细的农业分析。',
                },
              ],
            },
          ],
          max_tokens: 500,
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      console.error('通义千问API调用失败:', response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) return null;

    // 尝试解析JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch {
      console.error('解析AI返回的JSON失败:', content);
    }

    return null;
  } catch (error) {
    console.error('AI分析错误:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageBase64, landType, soilType, terrain } = body;

    let source: 'ai' | 'manual' = 'manual';
    let aiDetails: Record<string, string> | undefined;
    let finalLandType = landType || '旱地';
    let finalSoilType = soilType || '壤土';
    let finalTerrain = terrain || '平原';

    // 如果有图片且配置了API Key，尝试AI分析
    if (imageBase64) {
      const aiResult = await analyzeWithAI(imageBase64);
      if (aiResult) {
        source = 'ai';
        aiDetails = aiResult;
        finalLandType = aiResult.landType || finalLandType;
        finalSoilType = aiResult.soilType || finalSoilType;
        finalTerrain = aiResult.terrain || finalTerrain;
      }
    }

    // 使用规则引擎分析
    const fertility = estimateFertility(finalSoilType);
    const drainage = estimateDrainage(finalTerrain, finalSoilType);
    const suitableCrops = getSuitableCrops(finalSoilType, finalTerrain);
    const suggestions = getSuggestions(finalSoilType, finalTerrain, finalLandType);

    const analysis = {
      landType: finalLandType,
      soilType: finalSoilType,
      terrain: finalTerrain,
      fertility,
      drainage,
      suitableCrops,
      suggestions,
      ...(aiDetails && { aiDetails }),
    };

    return NextResponse.json({
      source,
      analysis,
    });
  } catch (error) {
    console.error('分析API错误:', error);
    return NextResponse.json(
      { error: '服务器内部错误，请稍后重试' },
      { status: 500 }
    );
  }
}
