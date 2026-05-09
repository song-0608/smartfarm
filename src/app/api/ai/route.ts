import { NextRequest, NextResponse } from 'next/server';

// 直接硬编码API Key作为备选方案（生产环境应使用环境变量）
const API_KEY = process.env.ZHIPU_API_KEY || '5c2c3c310dc54e9198d460382c6aae82.6yD8AT0fsLjnGSxr';

// 备用农业知识库回复
const getFallbackReply = (question: string): string => {
  const lowerQ = question.toLowerCase();
  
  if (lowerQ.includes('水稻') || lowerQ.includes('稻子')) {
    return `🌾 水稻种植指南：

【播种时间】3-5月（早稻）、5-6月（晚稻）
【适宜条件】气温15-35°C，充足水源
【关键步骤】
1. 选种：选择抗病高产品种
2. 育秧：浸种催芽后播种
3. 移栽：秧苗30天左右移栽
4. 管理：保持水层3-5cm，分蘖期追肥
5. 收割：稻穗金黄时收割

【常见问题】稻瘟病、稻飞虱，注意及时防治。

需要更详细的某个环节指导吗？`;
  }
  
  if (lowerQ.includes('小麦')) {
    return `🌾 小麦种植指南：

【播种时间】10-11月（冬小麦）
【适宜条件】耐寒，适宜温度15-20°C
【关键步骤】
1. 整地：深耕细耙，施足底肥
2. 播种：条播或撒播，亩用种15-20斤
3. 管理：越冬前浇封冻水，返青期追肥
4. 防治：注意锈病，白粉病、蚜虫
5. 收割：5-6月成熟后及时收割

【产量】一般亩产800-1200斤。`;
  }
  
  if (lowerQ.includes('玉米')) {
    return `🌽 玉米种植指南：

【播种时间】4-6月
【适宜条件】喜温，适宜温度20-30°C
【关键步骤】
1. 选种：根据用途选粮用或饲用品种
2. 播种：穴播，每亩3000-4000株
3. 施肥：大喇叭口期重施氮肥
4. 灌溉：抽雄期需水量大
5. 防治：玉米螟、大小斑病

【产量】一般亩产1000-1500斤。`;
  }
  
  if (lowerQ.includes('番茄') || lowerQ.includes('西红柿')) {
    return `🍅 番茄种植指南：

【播种时间】2-3月育苗，4-5月定植
【适宜条件】喜温，适宜温度20-30°C
【关键步骤】
1. 育苗：温床育苗，苗龄60天
2. 定植：株距30-40cm，行距60cm
3. 整枝：单杆整枝，及时打杈
4. 施肥：基肥为主，果期追施钾肥
5. 采收：转色后及时采收

【常见问题】灰霉病、晚疫病、脐腐病。`;
  }
  
  if (lowerQ.includes('黄瓜')) {
    return `🥒 黄瓜种植指南：

【播种时间】3-4月直播或育苗
【适宜条件】喜温喜湿，适宜温度18-32°C
【关键步骤】
1. 整地：施足有机肥，起垄栽培
2. 播种：穴播，每穴2-3粒
3. 搭架：蔓长20cm时搭架绑蔓
4. 管理：小水勤浇，保持湿润
5. 采收：嫩瓜及时采收

【常见问题】霜霉病、白粉病、蚜虫。`;
  }
  
  if (lowerQ.includes('虫') || lowerQ.includes('病')) {
    return `🐛 病虫害防治原则：

【预防为主】
1. 选用抗病虫品种
2. 合理轮作倒茬
3. 及时清除病残体
4. 保持田间通风透光

【科学用药】
• 蚜虫：吡虫啉、啶虫脒
• 稻飞虱：噻嗪酮、吡蚜酮
• 稻瘟病：三环唑、稻瘟灵
• 锈病：三唑酮、戊唑醇

【注意事项】
• 轮换用药，避免抗药性
• 安全间隔期采收
• 保护天敌，生物防治

具体是什么作物出现了什么问题？`;
  }
  
  if (lowerQ.includes('价格') || lowerQ.includes('行情') || lowerQ.includes('菜价') || lowerQ.includes('多少钱') || lowerQ.includes('贵不贵') || lowerQ.includes('涨') || lowerQ.includes('跌')) {
    return `💰 农产品价格建议：

【官方渠道】
1. 农业农村部市场信息平台
2. 地方农产品批发市场
3. 当地农业部门价格监测

【影响因素】
• 季节性：旺季价格低，淡季高
• 天气：灾害天气导致涨价
• 节假日：节前需求增加
• 运输成本：油价、人工影响

【建议】
• 关注长期趋势，不只看单日价
• 适时出售，避免集中上市
• 考虑储存成本和市场风险

您想了解哪种农产品的价格？`;
  }
  
  if (lowerQ.includes('天气') || lowerQ.includes('下雨') || lowerQ.includes('温度')) {
    return `🌤️ 农事天气建议：

【关注要点】
1. 温度：作物生长的适宜温度范围
2. 降水：灌溉需求和排水防涝
3. 风力：喷药和授粉的影响
4. 湿度：病虫害发生条件

【农事安排】
• 晴天：适合喷药、施肥、收获
• 阴天：适合移栽、播种
• 雨天：不宜喷药，注意排水
• 大风天：不宜喷药、授粉

建议查看App首页的天气信息。`;
  }
  
  // 通用回复
  return `您好！我是您的农业助手。

我可以帮您：
🌾 查询作物种植技术
🐛 诊断病虫害问题
💰 了解农产品市场行情
🌤️ 获取天气农事建议
📸 识别作物病虫害（上传照片）

请告诉我您想了解什么？`;
};

export async function POST(req: NextRequest) {
  try {
    const { messages, imageBase64 } = await req.json();
    
    const lastMessage = messages[messages.length - 1]?.content || '';
    
    // 检查API Key是否存在
    if (!API_KEY) {
      console.log('[AI API] 错误: 未配置API Key');
      return NextResponse.json({ 
        reply: getFallbackReply(lastMessage),
        source: 'fallback',
        reason: 'no_api_key'
      });
    }
    
    console.log('[AI API] 开始调用智谱AI, Key前缀:', API_KEY.substring(0, 8) + '...');
    
    // 调用智谱AI API，带超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 增加到15秒
    
    try {
      const requestBody: Record<string, unknown> = {
        model: imageBase64 ? 'glm-4v-flash' : 'glm-4-flash',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的农业专家，擅长作物种植、病虫害防治、土壤管理、农产品市场分析等领域。请用通俗易懂的语言回答农户的问题，给出具体可操作的建议。回复要简洁实用，避免过长的开场白。'
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1500,
      };
      
      // 如果有图片，添加图片内容
      if (imageBase64) {
        requestBody.messages = [
          {
            role: 'system',
            content: '你是一位专业的农业专家，擅长作物种植、病虫害防治、土壤管理、农产品市场分析等领域。请用通俗易懂的语言回答农户的问题，给出具体可操作的建议。回复要简洁实用，避免过长的开场白。'
          },
          ...messages.slice(0, -1),
          {
            role: 'user',
            content: [
              { type: 'text', text: lastMessage || '请分析这张图片中的作物状况，如果有病虫害请说明症状和防治方法。' },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }
        ];
      }
      
      console.log('[AI API] 请求体准备完成, 模型:', requestBody.model);
      
      const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      console.log('[AI API] 响应状态:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { raw: errorText };
        }
        console.error('[AI API] API错误:', response.status, errorData);
        
        // 返回更详细的错误信息
        return NextResponse.json({ 
          reply: getFallbackReply(lastMessage),
          source: 'fallback',
          reason: 'api_error',
          error: {
            status: response.status,
            message: errorData.error?.message || errorData.error?.code || 'API调用失败'
          }
        });
      }

      const data = await response.json();
      console.log('[AI API] 响应数据:', JSON.stringify(data).substring(0, 200) + '...');
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[AI API] 返回格式异常:', data);
        return NextResponse.json({ 
          reply: getFallbackReply(lastMessage),
          source: 'fallback',
          reason: 'invalid_response'
        });
      }
      
      console.log('[AI API] 成功获取AI回复');
      return NextResponse.json({ 
        reply: data.choices[0].message.content,
        source: 'ai',
        model: data.model
      });
      
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const err = fetchError as Error;
      if (err.name === 'AbortError') {
        console.error('[AI API] 请求超时');
        return NextResponse.json({ 
          reply: getFallbackReply(lastMessage),
          source: 'fallback',
          reason: 'timeout'
        });
      } else {
        console.error('[AI API] 请求失败:', err.message);
        return NextResponse.json({ 
          reply: getFallbackReply(lastMessage),
          source: 'fallback',
          reason: 'network_error',
          error: err.message
        });
      }
    }
    
  } catch (error: unknown) {
    console.error('[AI API] 处理错误:', error);
    const err = error as Error;
    return NextResponse.json({ 
      reply: '抱歉，服务暂时遇到问题，请稍后再试。',
      source: 'fallback',
      reason: 'server_error',
      error: err.message
    });
  }
}

// GET 方法用于测试 API 状态
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    apiKeyConfigured: !!API_KEY,
    keyPrefix: API_KEY ? API_KEY.substring(0, 8) + '...' : null,
    timestamp: new Date().toISOString()
  });
}
