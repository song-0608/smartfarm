import { NextRequest, NextResponse } from 'next/server';

// API Key 从环境变量获取（请在 .env.local 中配置 ZHIPU_API_KEY）
// 如果没有配置，将使用内置的演示Key（仅供测试，请勿用于生产）
const API_KEY = process.env.ZHIPU_API_KEY;

// 备用农业知识库回复
const getFallbackReply = (question: string, intent?: string): string => {
  const lowerQ = question.toLowerCase();
  
  // 根据意图提供更精准的回复
  if (intent === 'price' || lowerQ.includes('价格') || lowerQ.includes('行情') || lowerQ.includes('菜价') || lowerQ.includes('多少钱')) {
    return `💰 关于农产品价格：

目前我无法获取实时价格数据，建议您通过以下渠道查询：

【官方渠道】
1. 农业农村部市场信息平台（www.moa.gov.cn）
2. 全国农产品批发市场价格信息系统
3. 当地农业农村局官网

【市场规律】
• 蔬菜：夏季供应充足价格低，冬季大棚菜价格高
• 粮食：新粮上市时价格较低，春节前需求增加
• 建议关注长期趋势，合理安排种植和销售

您想了解哪种作物的具体行情？`;
  }
  
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

【常见问题】稻瘟病、稻飞虱，注意及时防治。`;
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

// 识别用户意图
const detectIntent = (text: string): string => {
  const lower = text.toLowerCase();
  if (/价格|行情|多少钱|收购价|市场价|菜价|肉价|蛋价|油价/.test(lower)) return 'price';
  if (/天气|温度|下雨|降水|湿度|刮风/.test(lower)) return 'weather';
  if (/病|虫|害|打药|防治|症状|农药|杀虫/.test(lower)) return 'pest';
  if (/怎么种|种植|栽培|施肥|浇水|管理/.test(lower)) return 'crop';
  if (/任务|提醒|记录|农事|待办/.test(lower)) return 'task';
  if (/农事|日历|什么时候|几月|节气/.test(lower)) return 'calendar';
  if (/你好|您好|在吗|早上好|下午好/.test(lower)) return 'greeting';
  return 'general';
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, imageBase64, intent } = body;
    
    console.log('[AI API] 收到请求:', { 
      messageCount: messages?.length, 
      hasImage: !!imageBase64,
      intent: intent || detectIntent(messages?.[messages?.length - 1]?.content || '')
    });
    
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.error('[AI API] 错误: 消息为空');
      return NextResponse.json({ 
        reply: '抱歉，我没有收到您的问题，请重新输入。',
        source: 'fallback',
        reason: 'empty_messages'
      });
    }
    
    const lastMessage = messages[messages.length - 1]?.content || '';
    const detectedIntent = intent || detectIntent(lastMessage);
    
    console.log('[AI API] 最后一条消息:', lastMessage.substring(0, 50));
    console.log('[AI API] 检测到意图:', detectedIntent);
    
    // 检查API Key是否存在
    if (!API_KEY) {
      console.log('[AI API] 错误: 未配置API Key');
      return NextResponse.json({ 
        reply: getFallbackReply(lastMessage, detectedIntent),
        source: 'fallback',
        reason: 'no_api_key',
        intent: detectedIntent
      });
    }
    
    console.log('[AI API] 开始调用智谱AI, Key前缀:', API_KEY.substring(0, 8) + '...');
    
    // 调用智谱AI API，带超时控制
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);
    
    try {
      // 获取本地市场数据（从请求中传入）
      const marketData = body.marketData || [];
      const weatherData = body.weatherData || null;
      
      // 构建包含本地数据的system prompt
      let systemPrompt = '你是智农APP的AI助手，专门服务农户。请用通俗易懂的语言回答，给出具体可操作的建议。回复简洁实用，直接回答问题。\n\n';
      
      // 注入市场行情数据
      if (marketData && marketData.length > 0) {
        systemPrompt += '【当前市场行情数据】\n';
        for (const item of marketData) {
          systemPrompt += `- ${item.name}：${item.price}元/斤，${item.change || '持平'}\n`;
        }
        systemPrompt += '\n当用户询问价格、行情、菜价时，请直接使用以上数据回答，不要说"无法获取"。给出价格分析和种植/销售建议。\n\n';
      }
      
      // 注入天气数据
      if (weatherData) {
        systemPrompt += `【当前天气信息】\n`;
        systemPrompt += `- 温度：${weatherData.temperature}℃\n`;
        systemPrompt += `- 湿度：${weatherData.humidity}%\n`;
        systemPrompt += `- 风速：${weatherData.windSpeed}km/h\n`;
        systemPrompt += `- 天气：${weatherData.description}\n`;
        systemPrompt += `- 适宜作物：${(weatherData.suitableCrops || []).join('、')}\n\n`;
        systemPrompt += '当用户询问天气时，请结合以上数据给出农事建议。\n\n';
      }
      
      systemPrompt += '【你的能力范围】\n';
      systemPrompt += '- 作物种植技术指导\n';
      systemPrompt += '- 病虫害诊断和防治建议\n';
      systemPrompt += '- 农产品价格行情分析（使用上面的数据）\n';
      systemPrompt += '- 天气农事建议（使用上面的数据）\n';
      systemPrompt += '- 农事日历和节气安排\n';
      systemPrompt += '- 施肥、灌溉等农事操作指导\n\n';
      systemPrompt += '【回答规范】\n';
      systemPrompt += '1. 价格问题：必须引用上面的市场数据，给出具体数字和涨跌分析，然后给出种植/销售建议\n';
      systemPrompt += '2. 天气问题：必须引用上面的天气数据，结合温度湿度给出具体农事操作建议\n';
      systemPrompt += '3. 种植问题：给出分步骤的种植指南，包括时间、条件、方法、注意事项\n';
      systemPrompt += '4. 病虫害问题：先描述症状识别方法，再给出具体防治方案（药物名称+用量+注意事项）\n';
      systemPrompt += '5. 通用问题：给出2-3条实用建议\n\n';
      systemPrompt += '【格式要求】\n';
      systemPrompt += '- 使用emoji让回复更生动（如🌾🐛💰🌤️📋）\n';
      systemPrompt += '- 使用【】标注段落标题\n';
      systemPrompt += '- 关键数据用粗体或数字突出\n';
      systemPrompt += '- 建议列表用编号1.2.3.\n';
      systemPrompt += '- 控制在200字以内，简洁实用\n\n';
      systemPrompt += '重要：回答要直接、具体、可操作。不要说"无法获取数据"，你有本地数据可以使用。';
      
      // 构建消息数组
      const apiMessages = [
        {
          role: 'system',
          content: systemPrompt
        },
        ...messages.map((m: {role: string, content: string}) => ({
          role: m.role === 'ai' ? 'assistant' : m.role,
          content: m.content
        }))
      ];
      
      // 如果有图片，使用专门的视觉分析 system prompt
      if (imageBase64) {
        apiMessages[0] = {
          role: 'system',
          content: '你是智农APP的AI视觉识别助手，专门服务农户进行作物和病虫害识别。请仔细分析这张图片，描述你看到的内容。\n\n' +
            '【分析要求】\n' +
            '1. 如果是农田/作物/植物，请识别具体种类、生长阶段、健康状态\n' +
            '2. 如果有病虫害，请详细描述症状特征（叶片斑点、变色、枯萎、虫害痕迹等）\n' +
            '3. 给出具体的防治建议（药物名称、使用方法、注意事项）\n' +
            '4. 如果是其他农业相关场景（土壤、农机、设施等），也请详细描述\n\n' +
            '【回答格式】\n' +
            '- 使用emoji让回复更生动（如🌾🐛💧🌱）\n' +
            '- 使用【】标注段落标题\n' +
            '- 关键信息用粗体突出\n' +
            '- 建议列表用编号1.2.3.\n' +
            '- 控制在300字以内，简洁实用\n\n' +
            '重要：必须基于图片内容进行分析，不要编造图片中不存在的内容。如果图片不清晰或无法识别，请如实说明。',
        };
        apiMessages.pop();
        apiMessages.push({
          role: 'user',
          content: [
            { type: 'text', text: lastMessage || '请仔细分析这张图片，描述你看到的内容。如果是农田/作物/植物，请识别具体种类、生长状态、是否有病虫害。' },
            { type: 'image_url', image_url: { url: imageBase64 } }
          ] as unknown as string
        });
      }
      
      const requestBody = {
        model: imageBase64 ? 'glm-4v-flash' : 'glm-4-flash',
        messages: apiMessages,
        temperature: 0.7,
        max_tokens: 1500,
      };
      
      console.log('[AI API] 请求体:', JSON.stringify(requestBody).substring(0, 300));
      
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
        
        return NextResponse.json({ 
          reply: getFallbackReply(lastMessage, detectedIntent),
          source: 'fallback',
          reason: 'api_error',
          intent: detectedIntent
        });
      }

      const data = await response.json();
      console.log('[AI API] 响应数据:', JSON.stringify(data).substring(0, 200));
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('[AI API] 返回格式异常:', data);
        return NextResponse.json({ 
          reply: getFallbackReply(lastMessage, detectedIntent),
          source: 'fallback',
          reason: 'invalid_response',
          intent: detectedIntent
        });
      }
      
      console.log('[AI API] 成功获取AI回复');
      return NextResponse.json({ 
        reply: data.choices[0].message.content,
        source: 'ai',
        model: data.model,
        intent: detectedIntent
      });
      
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const err = fetchError as Error;
      if (err.name === 'AbortError') {
        console.error('[AI API] 请求超时');
        return NextResponse.json({ 
          reply: getFallbackReply(lastMessage, detectedIntent),
          source: 'fallback',
          reason: 'timeout',
          intent: detectedIntent
        });
      } else {
        console.error('[AI API] 请求失败:', err.message);
        return NextResponse.json({ 
          reply: getFallbackReply(lastMessage, detectedIntent),
          source: 'fallback',
          reason: 'network_error',
          intent: detectedIntent
        });
      }
    }
    
  } catch (error: unknown) {
    console.error('[AI API] 处理错误:', error);
    return NextResponse.json({ 
      reply: '抱歉，服务暂时遇到问题，请稍后再试。',
      source: 'fallback',
      reason: 'server_error'
    });
  }
}

// GET 方法用于测试 API 状态
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    configured: !!API_KEY,
    timestamp: new Date().toISOString()
  });
}
