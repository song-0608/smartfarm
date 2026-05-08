import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 农产品基础数据：名称、基准价格（元/斤）、所属市场、单位
interface CropBase {
  name: string;
  basePrice: number;
  market: string;
  unit: string;
}

interface CropMarketData {
  name: string;
  currentPrice: number;
  priceChange: number;
  trend: 'up' | 'down' | 'stable';
  market: string;
  unit: string;
  history: Array<{ date: string; price: number }>;
}

interface PriceHistoryItem {
  date: string;
  price: number;
}

interface MacroPlantingArea {
  crop: string;
  area: string;
  change: string;
}

interface MacroSupplyDemand {
  crop: string;
  ratio: number;
  status: string;
}

interface MacroData {
  plantingArea: MacroPlantingArea[];
  supplyDemand: MacroSupplyDemand[];
  seasonalForecast: string;
  policyInfo: string;
}

interface BriefingItem {
  title: string;
  content: string;
  time: string;
  type: 'policy' | 'market' | 'warning' | 'opportunity';
}

// 农产品基准数据
const CROP_BASES: CropBase[] = [
  { name: '大蒜', basePrice: 6.50, market: '山东金乡大蒜市场', unit: '元/斤' },
  { name: '蒜薹', basePrice: 4.20, market: '山东金乡大蒜市场', unit: '元/斤' },
  { name: '水稻', basePrice: 1.55, market: '黑龙江哈尔滨粮油市场', unit: '元/斤' },
  { name: '玉米', basePrice: 1.30, market: '吉林长春玉米市场', unit: '元/斤' },
  { name: '小麦', basePrice: 1.45, market: '河南郑州粮食市场', unit: '元/斤' },
  { name: '大豆', basePrice: 2.80, market: '黑龙江哈尔滨粮油市场', unit: '元/斤' },
  { name: '土豆', basePrice: 1.20, market: '甘肃定西马铃薯市场', unit: '元/斤' },
  { name: '番茄', basePrice: 3.50, market: '山东寿光蔬菜市场', unit: '元/斤' },
  { name: '黄瓜', basePrice: 2.80, market: '山东寿光蔬菜市场', unit: '元/斤' },
  { name: '辣椒', basePrice: 5.00, market: '山东寿光蔬菜市场', unit: '元/斤' },
  { name: '白菜', basePrice: 0.80, market: '河北石家庄蔬菜市场', unit: '元/斤' },
  { name: '苹果', basePrice: 4.50, market: '陕西洛川苹果市场', unit: '元/斤' },
  { name: '柑橘', basePrice: 3.20, market: '江西赣州柑橘市场', unit: '元/斤' },
  { name: '茶叶', basePrice: 120.00, market: '浙江杭州龙井茶市场', unit: '元/斤' },
  { name: '花生', basePrice: 4.80, market: '河南驻马店花生市场', unit: '元/斤' },
  { name: '生姜', basePrice: 7.50, market: '山东安丘生姜市场', unit: '元/斤' },
  { name: '茄子', basePrice: 3.00, market: '山东寿光蔬菜市场', unit: '元/斤' },
  { name: '萝卜', basePrice: 1.00, market: '河北石家庄蔬菜市场', unit: '元/斤' },
];

// 生成30天历史价格数据（随机游走）
function generatePriceHistory(basePrice: number): PriceHistoryItem[] {
  const history: PriceHistoryItem[] = [];
  const now = new Date();
  // 随机选择一个整体趋势方向：-0.002 ~ +0.002 每步
  const trendBias = (Math.random() - 0.5) * 0.004;
  let price = basePrice * (1 + (Math.random() - 0.5) * 0.1); // 起始价在基准价附近

  for (let i = 29; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    // 随机游走：每日波动 -3% ~ +3%，加上趋势偏移
    const dailyVolatility = (Math.random() - 0.5) * 0.06;
    price = price * (1 + dailyVolatility + trendBias);
    // 确保价格不低于基准价的50%
    price = Math.max(price, basePrice * 0.5);
    // 四舍五入到两位小数
    price = Math.round(price * 100) / 100;

    history.push({ date: dateStr, price });
  }

  return history;
}

// 生成带随机波动的市场价格（含历史数据）
function generateMarketData(): CropMarketData[] {
  return CROP_BASES.map((crop) => {
    // 价格波动范围：基准价的 -15% ~ +15%
    const fluctuation = (Math.random() - 0.5) * 0.30;
    const currentPrice = Math.round(crop.basePrice * (1 + fluctuation) * 100) / 100;
    const priceChange = Math.round(((currentPrice - crop.basePrice) / crop.basePrice) * 10000) / 100;

    let trend: 'up' | 'down' | 'stable';
    if (priceChange > 2) {
      trend = 'up';
    } else if (priceChange < -2) {
      trend = 'down';
    } else {
      trend = 'stable';
    }

    const history = generatePriceHistory(crop.basePrice);

    return {
      name: crop.name,
      currentPrice,
      priceChange,
      trend,
      market: crop.market,
      unit: crop.unit,
      history,
    };
  });
}

// 计算市场综合指数（以100为基准）
function calculateAverageIndex(crops: CropMarketData[]): number {
  if (crops.length === 0) return 100;
  const avgChange =
    crops.reduce((sum, crop) => sum + crop.priceChange, 0) / crops.length;
  return Math.round((100 + avgChange) * 100) / 100;
}

// 获取热门作物（涨幅最大的前3个）
function getHotCrops(crops: CropMarketData[]): CropMarketData[] {
  return Array.from(crops)
    .sort((a, b) => b.priceChange - a.priceChange)
    .slice(0, 3);
}

// 获取预警作物（跌幅较大，存在供过于求风险的作物）
function getWarningCrops(crops: CropMarketData[]): CropMarketData[] {
  return Array.from(crops)
    .filter((crop) => crop.priceChange < -5)
    .sort((a, b) => a.priceChange - b.priceChange);
}

// 生成宏观农业数据
function generateMacroData(): MacroData {
  const plantingArea: MacroPlantingArea[] = [
    { crop: '水稻', area: '4.52亿亩', change: '+0.3%' },
    { crop: '小麦', area: '3.56亿亩', change: '-0.1%' },
    { crop: '玉米', area: '6.48亿亩', change: '+1.2%' },
    { crop: '大豆', area: '1.96亿亩', change: '+5.8%' },
    { crop: '蔬菜', area: '3.28亿亩', change: '+0.6%' },
    { crop: '水果', area: '2.15亿亩', change: '+1.5%' },
  ];

  const supplyDemand: MacroSupplyDemand[] = [
    { crop: '水稻', ratio: 1.05, status: '供需平衡' },
    { crop: '小麦', ratio: 1.12, status: '供给充裕' },
    { crop: '玉米', ratio: 0.95, status: '供给偏紧' },
    { crop: '大豆', ratio: 0.82, status: '供给不足' },
    { crop: '大蒜', ratio: 1.20, status: '供给过剩' },
    { crop: '番茄', ratio: 0.98, status: '供需平衡' },
  ];

  const seasonalForecast = '当前正值春夏交替时节，建议关注：1）北方地区进入春播高峰期，玉米和大豆种植面积预计增加，需关注播种进度和土壤墒情；2）南方早稻进入分蘖期，注意田间水肥管理；3）露地蔬菜逐步进入换茬期，茄果类蔬菜供应量将稳步增加；4）水果方面，柑橘尾市收尾，时令水果开始上市，价格预计稳中有降。整体来看，二季度农产品市场供给将逐步充裕，价格大幅上涨可能性较低。';

  const policyInfo = '【最新政策】农业农村部发布2026年粮食生产指导性意见，要求稳定粮食播种面积，确保粮食产量保持在1.3万亿斤以上。继续实施大豆振兴计划，扩大大豆种植面积1000万亩以上。加大对种粮农民补贴力度，小麦最低收购价每斤提高0.02元。同时，加强农产品市场监测预警，做好重要农产品保供稳价工作。';

  return { plantingArea, supplyDemand, seasonalForecast, policyInfo };
}

// 生成市场简报
function generateBriefings(): BriefingItem[] {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return [
    {
      title: '农业农村部：2026年粮食生产目标确定',
      content: '农业农村部召开全国春季农业生产会议，明确2026年粮食产量目标不低于1.3万亿斤，要求各地落实播种面积，加强田间管理。',
      time: `${todayStr} 09:30`,
      type: 'policy',
    },
    {
      title: '玉米期货价格连续三日上涨',
      content: '受国际玉米价格走高及国内饲料需求增加影响，玉米期货主力合约连续三日上涨，累计涨幅达3.2%，现货市场跟涨情绪浓厚。',
      time: `${todayStr} 10:15`,
      type: 'market',
    },
    {
      title: '大蒜价格预警：库存持续高位',
      content: '据全国农产品批发市场监测数据显示，大蒜库存量较去年同期增长28%，近期价格承压下行，建议蒜农合理安排出货节奏。',
      time: `${todayStr} 11:00`,
      type: 'warning',
    },
    {
      title: '大豆种植补贴政策利好',
      content: '财政部、农业农村部联合发布通知，2026年大豆种植补贴标准每亩提高至280元，较上年增加40元，鼓励农民扩大大豆种植面积。',
      time: `${todayStr} 14:20`,
      type: 'opportunity',
    },
    {
      title: '南方暴雨预警：蔬菜运输或受影响',
      content: '中央气象台发布暴雨黄色预警，预计未来三天江南、华南部分地区有大到暴雨，局部地区可能出现蔬菜运输困难，短期菜价或有波动。',
      time: `${todayStr} 16:45`,
      type: 'warning',
    },
  ];
}

export async function GET() {
  try {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const crops = generateMarketData();
    const averageIndex = calculateAverageIndex(crops);
    const hotCrops = getHotCrops(crops);
    const warningCrops = getWarningCrops(crops);
    const macro = generateMacroData();
    const briefings = generateBriefings();

    // 统计涨跌数量
    const upCount = crops.filter((c) => c.trend === 'up').length;
    const downCount = crops.filter((c) => c.trend === 'down').length;
    const stableCount = crops.filter((c) => c.trend === 'stable').length;

    // 去重热门作物名称
    const hotCropNames = Array.from(new Set(hotCrops.map((c) => c.name)));

    return NextResponse.json({
      success: true,
      updateTime: `${dateStr} ${timeStr}`,
      summary: {
        averageIndex,
        upCount,
        downCount,
        stableCount,
        totalCrops: crops.length,
        hotCrops: hotCrops.map((c) => ({
          name: c.name,
          priceChange: c.priceChange,
          currentPrice: c.currentPrice,
          unit: c.unit,
        })),
        warningCrops: warningCrops.map((c) => ({
          name: c.name,
          priceChange: c.priceChange,
          currentPrice: c.currentPrice,
          unit: c.unit,
          reason: '近期价格持续走低，存在供过于求风险',
        })),
        marketOverview: `今日农产品市场综合指数 ${averageIndex}，共监测 ${crops.length} 个品种。${upCount} 个品种上涨，${downCount} 个品种下跌，${stableCount} 个品种持平。`,
      },
      data: crops,
      history: crops.reduce<Record<string, PriceHistoryItem[]>>((acc, crop) => {
        acc[crop.name] = crop.history;
        return acc;
      }, {}),
      macro,
      briefings,
    });
  } catch (error) {
    console.error('市场价格数据生成错误:', error);
    return NextResponse.json(
      { success: false, error: '获取市场价格数据失败，请稍后重试' },
      { status: 500 }
    );
  }
}
