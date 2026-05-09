# 智农规划 - AI API接入指南

## 推荐的AI API方案

### 方案一：智谱GLM-4.6V-Flash（推荐）

**优点：**
- 完全免费
- 支持图片识别（可识别作物病虫害）
- 中文理解能力强
- 响应速度快

**接入步骤：**

1. 注册智谱AI账号：https://open.bigmodel.cn/
2. 获取API Key
3. 安装SDK：`npm install zhipuai`
4. 创建API路由文件

**代码示例：**

```typescript
// src/app/api/ai/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.ZHIPU_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { messages, imageBase64 } = await req.json();
    
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
            content: '你是一位专业的农业专家，擅长作物种植、病虫害防治、土壤管理等领域。请用通俗易懂的语言回答农户的问题。'
          },
          ...messages,
          ...(imageBase64 ? [{
            role: 'user',
            content: [
              { type: 'text', text: '请分析这张图片中的作物状况' },
              { type: 'image_url', image_url: { url: imageBase64 } }
            ]
          }] : [])
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: 'AI服务暂时不可用' }, { status: 500 });
  }
}
```

### 方案二：百度文心一言

**优点：**
- 农业场景优化好
- 知识库丰富
- 稳定性高

**接入步骤：**

1. 注册百度智能云：https://cloud.baidu.com/
2. 创建应用获取API Key和Secret Key
3. 安装SDK：`npm install @baiducloud/qianfan`

**代码示例：**

```typescript
// src/app/api/ai-wenxin/route.ts
import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.WENXIN_API_KEY;
const SECRET_KEY = process.env.WENXIN_SECRET_KEY;

// 获取access_token
async function getAccessToken() {
  const response = await fetch(
    `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`,
    { method: 'POST' }
  );
  const data = await response.json();
  return data.access_token;
}

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const accessToken = await getAccessToken();
    
    const response = await fetch(
      `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat/ernie-speed-128k?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: '你是一位专业的农业技术专家，熟悉各种农作物的种植技术、病虫害防治、土壤肥料管理等知识。请用通俗易懂的语言为农户提供专业的农业指导。'
            },
            ...messages
          ],
          temperature: 0.7,
          max_output_tokens: 2000,
        }),
      }
    );

    const data = await response.json();
    return NextResponse.json({ reply: data.result });
  } catch (error) {
    console.error('AI API Error:', error);
    return NextResponse.json({ error: 'AI服务暂时不可用' }, { status: 500 });
  }
}
```

## 环境变量配置

在项目根目录创建 `.env.local` 文件：

```bash
# 智谱AI
ZHIPU_API_KEY=your_zhipu_api_key_here

# 百度文心一言（可选）
WENXIN_API_KEY=your_wenxin_api_key
WENXIN_SECRET_KEY=your_wenxin_secret_key
```

## 前端调用示例

修改 `src/app/page.tsx` 中的AI助手处理函数：

```typescript
// 替换原有的processMessage函数
const processMessage = async (text: string) => {
  setChatMessages(prev => [...prev, { role: 'user', text }]);
  setIsTyping(true);
  
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          ...chatMessages.map(m => ({ role: m.role, content: m.text })),
          { role: 'user', content: text }
        ]
      }),
    });
    
    const data = await response.json();
    
    if (data.reply) {
      setChatMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
    } else {
      setChatMessages(prev => [...prev, { 
        role: 'ai', 
        text: '抱歉，AI服务暂时不可用，请稍后再试。' 
      }]);
    }
  } catch (error) {
    console.error('AI调用失败:', error);
    setChatMessages(prev => [...prev, { 
      role: 'ai', 
      text: '抱歉，网络连接失败，请检查网络后重试。' 
    }]);
  }
  
  setIsTyping(false);
};
```

## 图片识别功能

要实现作物病虫害图片识别，可以这样调用：

```typescript
const analyzeImage = async (imageBase64: string) => {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: '请分析这张作物图片' }],
      imageBase64: imageBase64, // base64编码的图片
    }),
  });
  
  const data = await response.json();
  return data.reply;
};
```

## 费用说明

| API | 免费额度 | 超出后费用 |
|-----|---------|-----------|
| 智谱GLM-4.6V-Flash | 完全免费 | 免费 |
| 百度文心一言ERNIE-Speed | 500万tokens/月 | 0.005元/千tokens |
| 百度文心一言ERNIE-4.0 | 2000tokens/天 | 0.12元/千tokens |

## 推荐方案

**个人/小团队**：使用智谱GLM-4.6V-Flash（完全免费）

**企业/高并发**：使用百度文心一言ERNIE-Speed（性价比高）

## 注意事项

1. API Key不要硬编码在代码中，使用环境变量
2. 添加错误处理和重试机制
3. 考虑添加请求限流，防止滥用
4. 图片识别时建议压缩图片大小（建议不超过2MB）
