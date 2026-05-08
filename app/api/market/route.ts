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

// 生成带随机波动的市场价格
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

    return {
      name: crop.name,
      currentPrice,
      priceChange,
      trend,
      market: crop.market,
      unit: crop.unit,
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

export async function GET() {
  try {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const crops = generateMarketData();
    const averageIndex = calculateAverageIndex(crops);
    const hotCrops = getHotCrops(crops);
    const warningCrops = getWarningCrops(crops);

    // 统计涨跌数量
    const upCount = crops.filter((c) => c.trend === 'up').length;
    const downCount = crops.filter((c) => c.trend === 'down').length;
    const stableCount = crops.filter((c) => c.trend === 'stable').length;

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
    });
  } catch (error) {
    console.error('市场价格数据生成错误:', error);
    return NextResponse.json(
      { success: false, error: '获取市场价格数据失败，请稍后重试' },
      { status: 500 }
    );
  }
}
