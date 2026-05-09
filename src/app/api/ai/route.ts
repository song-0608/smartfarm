import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.ZHIPU_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { messages, imageBase64 } = await req.json();
    
    // 如果没有配置API Key，返回模拟回复（用于演示）
    if (!API_KEY) {
      console.log('AI API: 未配置API Key，使用模拟回复');
      
      // 简单的模拟回复逻辑
      const lastMessage = messages[messages.length - 1]?.content || '';
      let mockReply = '';
      
      if (lastMessage.includes('水稻')) {
        mockReply = '水稻种植要点：\n1. 选择抗病品种\n2. 适时播种（3-5月）\n3. 合理密植\n4. 注意水肥管理\n5. 及时防治病虫害\n\n如需更详细的指导，请配置智谱AI API Key。';
      } else if (lastMessage.includes('虫') || lastMessage.includes('病')) {
        mockReply = '病虫害防治建议：\n1. 预防为主，综合防治\n2. 选用抗病虫品种\n3. 合理轮作倒茬\n4. 及时清除病残体\n5. 科学使用农药\n\n如需AI识别病虫害图片，请配置智谱AI API Key。';
      } else if (lastMessage.includes('价格') || lastMessage.includes('行情')) {
        mockReply = '农产品价格受多种因素影响：\n1. 季节因素\n2. 供求关系\n3. 天气影响\n4. 政策因素\n\n建议关注农业农村部市场信息平台获取最新行情。';
      } else {
        mockReply = '您好！我是智农助手。\n\n我目前处于演示模式。要获得更智能的AI回复，请：\n\n1. 注册智谱AI账号：https://open.bigmodel.cn/\n2. 获取免费API Key\n3. 在.env.local文件中添加：ZHIPU_API_KEY=your_api_key\n\n配置后即可享受：\n✓ 专业农业知识问答\n✓ 作物病虫害图片识别\n✓ 个性化种植建议\n✓ 实时市场行情分析';
      }
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return NextResponse.json({ reply: mockReply });
    }
    
    // 调用智谱AI API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: 'glm-4v-flash',
        messages: [
          {
            role: 'system',
            content: '你是一位专业的农业专家，擅长作物种植、病虫害防治、土壤管理、农产品市场分析等领域。请用通俗易懂的语言回答农户的问题，给出具体可操作的建议。'
          },
          ...messages,
          ...(imageBase64 ? [{
            role: 'user',
            content: [
              { type: 'text', text: '请分析这张图片中的作物状况，如果有病虫害请说明症状和防治方法。' },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }] : [])
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('智谱AI API错误:', errorData);
      return NextResponse.json({ 
        error: 'AI服务暂时不可用，请稍后重试',
        details: errorData 
      }, { status: 500 });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('智谱AI API返回格式异常:', data);
      return NextResponse.json({ 
        error: 'AI服务返回异常，请稍后重试' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({ 
      error: 'AI服务暂时不可用，请检查网络连接' 
    }, { status: 500 });
  }
}
