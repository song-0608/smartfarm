import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 根据WMO天气代码获取中文描述
const WMO_WEATHER_CODES: Record<number, string> = {
  0: '晴朗',
  1: '大部晴朗',
  2: '局部多云',
  3: '多云',
  45: '有雾',
  48: '沉积雾凇',
  51: '轻微毛毛雨',
  53: '中度毛毛雨',
  55: '密集毛毛雨',
  56: '冻毛毛雨（轻微）',
  57: '冻毛毛雨（密集）',
  61: '小雨',
  63: '中雨',
  65: '大雨',
  66: '冻雨（轻微）',
  67: '冻雨（密集）',
  71: '小雪',
  73: '中雪',
  75: '大雪',
  77: '雪粒',
  80: '小阵雨',
  81: '中阵雨',
  82: '大阵雨',
  85: '小阵雪',
  86: '大阵雪',
  95: '雷暴',
  96: '雷暴伴小冰雹',
  99: '雷暴伴大冰雹',
};

function getWeatherDescription(code: number): string {
  return WMO_WEATHER_CODES[code] || '未知天气';
}

// 根据月份返回季节
function getSeason(month: number): string {
  if (month >= 3 && month <= 5) return '春季';
  if (month >= 6 && month <= 8) return '夏季';
  if (month >= 9 && month <= 11) return '秋季';
  return '冬季';
}

// 根据温度和降水返回适宜作物列表
function getSuitableCropsByWeather(avgTemp: number, totalPrecip: number): string[] {
  const crops: string[] = [];

  if (avgTemp >= 20 && avgTemp <= 35) {
    crops.push('水稻', '玉米', '西瓜', '番茄', '辣椒', '茄子', '黄瓜', '莲藕');
  }
  if (avgTemp >= 15 && avgTemp <= 28) {
    crops.push('大豆', '花生', '红薯', '茶叶', '柑橘', '生菜', '白菜');
  }
  if (avgTemp >= 10 && avgTemp <= 25) {
    crops.push('小麦', '土豆', '菠菜', '大蒜');
  }
  if (avgTemp >= 5 && avgTemp <= 20) {
    crops.push('高粱', '大麦');
  }

  if (totalPrecip >= 500) {
    crops.push('水稻', '莲藕', '茶叶');
  } else if (totalPrecip >= 300) {
    crops.push('玉米', '大豆', '白菜', '菠菜');
  } else if (totalPrecip < 200) {
    crops.push('花生', '红薯', '高粱', '西瓜');
  }

  // 去重
  return Array.from(new Set(crops));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = searchParams.get('lat');
    const lon = searchParams.get('lon');

    if (!lat || !lon) {
      return NextResponse.json(
        { error: '缺少必要参数：lat 和 lon' },
        { status: 400 }
      );
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lon);

    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'lat 和 lon 必须为有效数字' },
        { status: 400 }
      );
    }

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: '经纬度超出有效范围' },
        { status: 400 }
      );
    }

    // 调用 Open-Meteo API
    const params = new URLSearchParams({
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      current: 'temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m',
      hourly: 'temperature_2m,relative_humidity_2m,precipitation,weather_code,soil_temperature_0cm,soil_moisture_0_to_1cm',
      daily: 'temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,et0_fao_evapotranspiration',
      timezone: 'auto',
      forecast_days: '7',
    });

    const weatherController = new AbortController();
    const weatherTimeoutId = setTimeout(() => weatherController.abort(), 8000);

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      { signal: weatherController.signal }
    );

    clearTimeout(weatherTimeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: `天气API请求失败：${response.status} ${response.statusText}` },
        { status: 502 }
      );
    }

    const data = await response.json();

    // 处理当前天气
    const current = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      weatherDescription: getWeatherDescription(data.current.weather_code),
      windSpeed: data.current.wind_speed_10m,
      time: data.current.time,
    };

    // 处理每日数据
    const daily = data.daily.time.map((date: string, index: number) => ({
      date,
      tempMax: data.daily.temperature_2m_max[index],
      tempMin: data.daily.temperature_2m_min[index],
      precipitation: data.daily.precipitation_sum[index],
      uvIndexMax: data.daily.uv_index_max[index],
      evapotranspiration: data.daily.et0_fao_evapotranspiration[index],
    }));

    // 处理逐时数据
    const hourly = data.hourly.time.map((time: string, index: number) => ({
      time,
      temperature: data.hourly.temperature_2m[index],
      humidity: data.hourly.relative_humidity_2m[index],
      precipitation: data.hourly.precipitation[index],
      weatherCode: data.hourly.weather_code[index],
      weatherDescription: getWeatherDescription(data.hourly.weather_code[index]),
      soilTemperature: data.hourly.soil_temperature_0cm?.[index] ?? null,
      soilMoisture: data.hourly.soil_moisture_0_to_1cm?.[index] ?? null,
    }));

    // 计算汇总信息
    const allTemps = data.hourly.temperature_2m as number[];
    const allPrecip = data.daily.precipitation_sum as number[];
    const allSoilMoisture = (data.hourly.soil_moisture_0_to_1cm as number[] | undefined) || [];

    const avgTemperature = allTemps.length > 0
      ? Math.round((allTemps.reduce((a: number, b: number) => a + b, 0) / allTemps.length) * 10) / 10
      : 0;

    const totalPrecipitation = allPrecip.length > 0
      ? Math.round(allPrecip.reduce((a: number, b: number) => a + b, 0) * 10) / 10
      : 0;

    const avgSoilMoisture = allSoilMoisture.length > 0
      ? Math.round((allSoilMoisture.reduce((a: number, b: number) => a + b, 0) / allSoilMoisture.length) * 10) / 10
      : 0;

    const currentMonth = new Date().getMonth() + 1;
    const season = getSeason(currentMonth);
    const suitableCrops = getSuitableCropsByWeather(avgTemperature, totalPrecipitation);

    const summary = {
      avgTemperature,
      totalPrecipitation,
      avgSoilMoisture,
      season,
      suitableCrops,
    };

    return NextResponse.json({
      location: {
        latitude,
        longitude,
        timezone: data.timezone,
        timezoneAbbr: data.timezone_abbreviation,
      },
      current,
      daily,
      hourly,
      summary,
    });
  } catch (error) {
    console.error('天气API错误:', error);
    
    // 返回备用天气数据，确保前端始终有数据展示
    const fallbackWeather = {
      temperature: 25,
      humidity: 65,
      windSpeed: 10,
      description: '晴',
      suitableCrops: ['水稻', '玉米', '番茄', '黄瓜'],
      updateTime: new Date().toLocaleString('zh-CN'),
      isFallback: true,
    };
    
    return NextResponse.json({
      success: true,
      isRealData: false,
      message: '使用备用天气数据',
      ...fallbackWeather,
    });
  }
}
