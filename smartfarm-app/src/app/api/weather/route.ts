import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get("lat");
  const lon = searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ error: "缺少经纬度参数" }, { status: 400 });
  }

  try {
    const params = new URLSearchParams({
      latitude: lat,
      longitude: lon,
      current: "temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m",
      hourly:
        "temperature_2m,relative_humidity_2m,precipitation,weather_code,soil_temperature_0cm,soil_moisture_0_to_1cm",
      daily:
        "temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,et0_fao_evapotranspiration",
      timezone: "auto",
      forecast_days: "7",
    });

    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
      { next: { revalidate: 1800 } }
    );

    if (!res.ok) {
      throw new Error(`天气API返回错误: ${res.status}`);
    }

    const data = await res.json();

    // WMO天气代码映射
    const weatherCodeMap: Record<number, string> = {
      0: "晴朗",
      1: "大部晴朗",
      2: "多云",
      3: "阴天",
      45: "雾",
      48: "雾凇",
      51: "小毛毛雨",
      53: "中毛毛雨",
      55: "大毛毛雨",
      56: "冻毛毛雨",
      57: "强冻毛毛雨",
      61: "小雨",
      63: "中雨",
      65: "大雨",
      66: "冻雨",
      67: "强冻雨",
      71: "小雪",
      73: "中雪",
      75: "大雪",
      77: "雪粒",
      80: "小阵雨",
      81: "中阵雨",
      82: "强阵雨",
      85: "小阵雪",
      86: "大阵雪",
      95: "雷暴",
      96: "雷暴伴小冰雹",
      99: "雷暴伴大冰雹",
    };

    const currentWeather = {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      weatherCode: data.current.weather_code,
      weatherText: weatherCodeMap[data.current.weather_code] || "未知",
      windSpeed: data.current.wind_speed_10m,
    };

    // 处理每日数据
    const daily = data.daily.time.map((date: string, i: number) => ({
      date,
      tempMax: data.daily.temperature_2m_max[i],
      tempMin: data.daily.temperature_2m_min[i],
      precipitation: data.daily.precipitation_sum[i],
      uvIndex: data.daily.uv_index_max[i],
      evapotranspiration: data.daily.et0_fao_evapotranspiration[i],
    }));

    // 处理小时数据（取未来24小时）
    const now = new Date();
    const hourlyData = data.hourly.time
      .map((time: string, i: number) => ({
        time,
        temperature: data.hourly.temperature_2m[i],
        humidity: data.hourly.relative_humidity_2m[i],
        precipitation: data.hourly.precipitation[i],
        weatherCode: data.hourly.weather_code[i],
        weatherText: weatherCodeMap[data.hourly.weather_code[i]] || "未知",
        soilTemp: data.hourly.soil_temperature_0cm?.[i],
        soilMoisture: data.hourly.soil_moisture_0_to_1cm?.[i],
      }))
      .filter((h: { time: string }) => new Date(h.time) >= now)
      .slice(0, 24);

    // 综合评估
    const avgTemp = daily.reduce((s: number, d: { tempMax: number; tempMin: number }) => s + (d.tempMax + d.tempMin) / 2, 0) / daily.length;
    const totalPrecip = daily.reduce((s: number, d: { precipitation: number }) => s + d.precipitation, 0);
    const avgSoilMoisture = hourlyData.length > 0 && hourlyData[0].soilMoisture
      ? hourlyData.reduce((s: number, h: { soilMoisture: number }) => s + (h.soilMoisture || 0), 0) / hourlyData.length
      : null;

    return NextResponse.json({
      location: { lat: parseFloat(lat), lon: parseFloat(lon) },
      current: currentWeather,
      daily,
      hourly: hourlyData,
      summary: {
        avgTemperature: Math.round(avgTemp * 10) / 10,
        totalPrecipitation: Math.round(totalPrecip * 10) / 10,
        avgSoilMoisture: avgSoilMoisture ? Math.round(avgSoilMoisture * 1000) / 1000 : null,
        season: getSeason(),
        suitableCrops: getSuitableCropsByWeather(avgTemp, totalPrecip),
      },
    });
  } catch (error) {
    console.error("天气API错误:", error);
    return NextResponse.json({ error: "获取天气数据失败" }, { status: 500 });
  }
}

function getSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春季";
  if (month >= 6 && month <= 8) return "夏季";
  if (month >= 9 && month <= 11) return "秋季";
  return "冬季";
}

function getSuitableCropsByWeather(avgTemp: number, totalPrecip: number): string[] {
  const crops: string[] = [];
  if (avgTemp >= 20 && avgTemp <= 35) {
    crops.push("水稻", "玉米", "西瓜", "番茄", "辣椒", "黄瓜");
  }
  if (avgTemp >= 15 && avgTemp <= 28) {
    crops.push("大豆", "花生", "茄子", "豆角", "土豆");
  }
  if (avgTemp >= 10 && avgTemp <= 25) {
    crops.push("小麦", "油菜", "菠菜", "生菜", "芹菜");
  }
  if (avgTemp >= 5 && avgTemp <= 20) {
    crops.push("大白菜", "萝卜", "大蒜", "洋葱");
  }
  if (totalPrecip < 10) {
    crops.push("高粱", "谷子", "红薯");
  }
  if (totalPrecip > 50) {
    crops.push("莲藕", "茭白", "水稻");
  }
  return [...new Set(crops)];
}
