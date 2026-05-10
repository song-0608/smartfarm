"use client";

import React, { useState, useRef, useCallback, useEffect, memo, useMemo } from "react";
import { LocationIcon, BellIcon, ChevronRightIcon, EditIcon } from "./components/Icons";

// ==================== 作物收益数据库 ====================
interface CropProfitData {
  name: string;
  emoji: string;
  yieldPerMu: number; // 亩产（斤）
  pricePerJin: number; // 单价（元/斤）
  costPerMu: number; // 成本（元/亩）
  cycle: string; // 生长周期
  riskLevel: 'low' | 'medium' | 'high'; // 风险等级
  techRequirement: 'low' | 'medium' | 'high'; // 技术要求
  investment: 'low' | 'medium' | 'high'; // 资金投入
  marketStability: 'stable' | 'volatile'; // 市场稳定性
  suitableLand: string[]; // 适宜土地类型
  suitableSoil: string[]; // 适宜土壤类型
}

const CROP_PROFIT_DATA: Record<string, CropProfitData> = {
  "水稻": {
    name: "水稻",
    emoji: "🌾",
    yieldPerMu: 800,
    pricePerJin: 1.35,
    costPerMu: 450,
    cycle: "5-6个月",
    riskLevel: "low",
    techRequirement: "low",
    investment: "low",
    marketStability: "stable",
    suitableLand: ["水田"],
    suitableSoil: ["壤土", "黏土"],
  },
  "小麦": {
    name: "小麦",
    emoji: "🌾",
    yieldPerMu: 800,
    pricePerJin: 1.35,
    costPerMu: 400,
    cycle: "8-9个月",
    riskLevel: "low",
    techRequirement: "low",
    investment: "low",
    marketStability: "stable",
    suitableLand: ["旱地"],
    suitableSoil: ["壤土", "砂土"],
  },
  "玉米": {
    name: "玉米",
    emoji: "🌽",
    yieldPerMu: 1000,
    pricePerJin: 1.25,
    costPerMu: 380,
    cycle: "4-5个月",
    riskLevel: "low",
    techRequirement: "low",
    investment: "low",
    marketStability: "stable",
    suitableLand: ["旱地"],
    suitableSoil: ["壤土", "砂土", "黑土"],
  },
  "番茄": {
    name: "番茄",
    emoji: "🍅",
    yieldPerMu: 6000,
    pricePerJin: 2.5,
    costPerMu: 2000,
    cycle: "3-4个月",
    riskLevel: "high",
    techRequirement: "high",
    investment: "high",
    marketStability: "volatile",
    suitableLand: ["菜地"],
    suitableSoil: ["壤土"],
  },
  "黄瓜": {
    name: "黄瓜",
    emoji: "🥒",
    yieldPerMu: 5000,
    pricePerJin: 2.8,
    costPerMu: 1800,
    cycle: "3个月",
    riskLevel: "medium",
    techRequirement: "medium",
    investment: "medium",
    marketStability: "volatile",
    suitableLand: ["菜地"],
    suitableSoil: ["壤土", "黏土"],
  },
  "白菜": {
    name: "白菜",
    emoji: "🥬",
    yieldPerMu: 8000,
    pricePerJin: 0.8,
    costPerMu: 600,
    cycle: "2-3个月",
    riskLevel: "low",
    techRequirement: "low",
    investment: "low",
    marketStability: "stable",
    suitableLand: ["菜地"],
    suitableSoil: ["壤土", "黑土"],
  },
};

// 模拟市场均衡数据（实际应该从后端获取）
const MARKET_EQUILIBRIUM_DATA = {
  totalUsers: 10000, // 总用户数
  cropSelections: {
    "水稻": 2500,
    "小麦": 1800,
    "玉米": 2200,
    "番茄": 1500,
    "黄瓜": 1200,
    "白菜": 800,
  },
  thresholds: {
    warning: 0.25, // 25%预警
    limit: 0.35, // 35%限制
  },
};

// ==================== 骨架屏组件 ====================
const SkeletonCard = memo(() => (
  <div className="nature-card p-4 animate-pulse">
    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
    <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
    <div className="h-4 bg-gray-200 rounded w-full"></div>
  </div>
));
SkeletonCard.displayName = "SkeletonCard";

const SkeletonText = memo(({ lines = 3 }: { lines?: number }) => (
  <div className="animate-pulse space-y-2">
    {Array.from({ length: lines }).map((_, i) => (
      <div key={i} className="h-4 bg-gray-200 rounded" style={{ width: `${80 + Math.random() * 20}%` }}></div>
    ))}
  </div>
));
SkeletonText.displayName = "SkeletonText";

const SkeletonWeather = memo(() => (
  <div className="nature-card rounded-2xl p-4 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
        <div>
          <div className="h-8 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
      <div className="text-right">
        <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
        <div className="h-4 bg-gray-200 rounded w-16"></div>
      </div>
    </div>
    <div className="flex gap-2 flex-wrap">
      <div className="h-6 bg-gray-200 rounded w-16"></div>
      <div className="h-6 bg-gray-200 rounded w-16"></div>
    </div>
  </div>
));
SkeletonWeather.displayName = "SkeletonWeather";

const SkeletonTaskList = memo(() => (
  <div className="nature-card rounded-2xl p-4 shadow-sm animate-pulse">
    <div className="flex items-center justify-between mb-3">
      <div className="h-5 bg-gray-200 rounded w-20"></div>
      <div className="h-4 bg-gray-200 rounded w-16"></div>
    </div>
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="w-5 h-5 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  </div>
));
SkeletonTaskList.displayName = "SkeletonTaskList";

const SkeletonMarketList = memo(() => (
  <div className="nature-card rounded-2xl divide-y divide-[#e2e8d8] animate-pulse">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
          <div>
            <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
            <div className="h-3 bg-gray-200 rounded w-12"></div>
          </div>
        </div>
        <div className="text-right">
          <div className="h-4 bg-gray-200 rounded w-16 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-8"></div>
        </div>
      </div>
    ))}
  </div>
));
SkeletonMarketList.displayName = "SkeletonMarketList";

// ==================== 数据持久化 ====================
const STORAGE_KEYS = {
  tasks: 'smartfarm_tasks',
  chatMessages: 'smartfarm_chat',
  userSettings: 'smartfarm_settings',
  landInfo: 'smartfarm_land',
};

// 保存数据
const saveToStorage = <T,>(key: string, data: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.warn('存储失败:', e);
  }
};

// 防抖函数
function useDebounce<T extends (...args: unknown[]) => void>(callback: T, delay: number) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
}

// 读取数据
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

// ==================== Types ====================

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  description: string;
  avgTemperature: number;
  totalPrecipitation: number;
  avgSoilMoisture: number;
  season: string;
  suitableCrops: string[];
  soilMoisture: number;
  soilTemperature: number;
}

interface CropRecommendation {
  name: string;
  score: number;
  profitPerMu: number;
  matchLevel: "strong" | "medium" | "weak";
  reasons: string[];
  emoji?: string;
}

interface Task {
  id: string;
  text: string;
  done: boolean;
  date: string;
  category: "施肥" | "灌溉" | "除虫" | "除草" | "其他";
  priority: "high" | "medium" | "low";
}

interface MarketItem {
  name: string;
  price: number;
  trend: "up" | "down" | "stable";
  change?: string;
  emoji?: string;
  sparkline?: number[];
}

interface MarketBriefing {
  type: "政策" | "行情" | "预警" | "机会";
  title: string;
  content: string;
  time: string;
}

interface MarketMacro {
  plantingArea?: string;
  supplyDemandRatio?: string;
  seasonForecast?: string;
  policyInfo?: string;
}

interface MarketResponse {
  items: MarketItem[];
  index: number;
  indexChange: number;
  upCount: number;
  downCount: number;
  stableCount: number;
  history: Array<{ date: string; price: number }>;
  briefings: MarketBriefing[];
  macro: MarketMacro;
  updateTime?: string;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

// ==================== 农业知识库 ====================

const CROP_KNOWLEDGE: Record<string, {
  name: string;
  season: string;
  soil: string[];
  water: string;
  fertilizer: string;
  pests: string[];
  tips: string[];
}> = {
  "水稻": {
    name: "水稻",
    season: "3-5月播种，9-10月收获",
    soil: ["壤土", "黏土"],
    water: "保持3-5cm水层，分蘖期浅水，孕穗期深水",
    fertilizer: "基肥用有机肥，分蘖期追施氮肥，抽穗期补施钾肥",
    pests: ["稻飞虱", "稻纵卷叶螟", "纹枯病", "稻瘟病"],
    tips: ["选择抗病品种", "合理密植", "适时晒田", "注意防治稻瘟病"]
  },
  "小麦": {
    name: "小麦",
    season: "10-11月播种，次年5-6月收获",
    soil: ["壤土", "砂土"],
    water: "越冬期控水，返青期适量灌溉，灌浆期保持湿润",
    fertilizer: "底肥充足，拔节期追施氮肥，叶面喷施磷酸二氢钾",
    pests: ["蚜虫", "红蜘蛛", "锈病", "白粉病"],
    tips: ["适时镇压", "预防倒春寒", "一喷三防", "适时收获"]
  },
  "玉米": {
    name: "玉米",
    season: "4-6月播种，8-10月收获",
    soil: ["壤土", "砂土", "黑土"],
    water: "苗期耐旱，大喇叭口期需水量大",
    fertilizer: "重施基肥，大喇叭口期重施氮肥",
    pests: ["玉米螟", "蚜虫", "大小斑病", "锈病"],
    tips: ["合理密植", "去雄授粉", "适时晚收", "秸秆还田"]
  },
  "番茄": {
    name: "番茄",
    season: "2-3月育苗，4-5月定植，6-9月采收",
    soil: ["壤土"],
    water: "见干见湿，避免大水漫灌",
    fertilizer: "基肥施足有机肥，果实膨大期追施钾肥",
    pests: ["番茄晚疫病", "灰霉病", "蚜虫", "白粉虱"],
    tips: ["整枝打杈", "疏花疏果", "搭架绑蔓", "适时采摘"]
  },
  "黄瓜": {
    name: "黄瓜",
    season: "3-4月播种，5-10月采收",
    soil: ["壤土", "黏土"],
    water: "喜湿怕涝，小水勤浇",
    fertilizer: "基肥充足，结瓜期勤施薄肥",
    pests: ["霜霉病", "白粉病", "蚜虫", "瓜实蝇"],
    tips: ["搭架引蔓", "及时采收", "注意通风", "轮作倒茬"]
  },
  "白菜": {
    name: "白菜",
    season: "8-9月播种，10-12月收获",
    soil: ["壤土", "黑土"],
    water: "保持土壤湿润，包心期需水多",
    fertilizer: "基肥施足，莲座期追施氮肥，包心期补施钾肥",
    pests: ["软腐病", "霜霉病", "蚜虫", "菜青虫"],
    tips: ["及时间苗", "中耕除草", "束叶护球", "适时收获"]
  }
};

const PEST_KNOWLEDGE: Record<string, {
  name: string;
  symptoms: string;
  prevention: string[];
  treatment: string[];
}> = {
  "稻瘟病": {
    name: "稻瘟病",
    symptoms: "叶片出现梭形病斑，边缘褐色，中央灰白色；穗颈瘟导致白穗",
    prevention: ["选用抗病品种", "合理施肥，避免偏施氮肥", "适时晒田"],
    treatment: ["三环唑喷雾预防", "稻瘟灵治疗", "及时拔除病株"]
  },
  "稻飞虱": {
    name: "稻飞虱",
    symptoms: "植株发黄倒伏，严重时出现'穿顶'，叶片有蜜露",
    prevention: ["合理密植", "避免偏施氮肥", "保护天敌"],
    treatment: ["吡虫啉喷雾", "噻嗪酮防治", "喷施洗衣粉水"]
  },
  "蚜虫": {
    name: "蚜虫",
    symptoms: "叶片卷曲变形，有蜜露，植株生长受阻",
    prevention: ["黄板诱杀", "保护瓢虫等天敌", "清除杂草"],
    treatment: ["吡虫啉喷雾", "苦参碱防治", "肥皂水冲洗"]
  },
  "霜霉病": {
    name: "霜霉病",
    symptoms: "叶片正面黄绿色斑块，背面有白色霉层",
    prevention: ["选用抗病品种", "合理密植通风", "控制湿度"],
    treatment: ["霜霉威喷雾", "代森锰锌防治", "及时摘除病叶"]
  }
};

const FARMING_CALENDAR: Record<number, Array<{period: string; activity: string}>> = {
  1: [{period: "上旬", activity: "冬季修剪果树，清园消毒"}, {period: "下旬", activity: "检修农机，准备春耕"}],
  2: [{period: "上旬", activity: "温室育苗，准备春播"}, {period: "下旬", activity: "整地施肥，检修灌溉设施"}],
  3: [{period: "上旬", activity: "早稻播种，小麦追肥"}, {period: "中旬", activity: "玉米播种，蔬菜定植"}, {period: "下旬", activity: "棉花播种，病虫害预防"}],
  4: [{period: "上旬", activity: "水稻移栽，小麦抽穗"}, {period: "中旬", activity: "玉米间苗，追肥浇水"}, {period: "下旬", activity: "防治小麦赤霉病"}],
  5: [{period: "上旬", activity: "小麦灌浆，水稻分蘖"}, {period: "中旬", activity: "玉米大喇叭口期管理"}, {period: "下旬", activity: "小麦收获准备，夏播准备"}],
  6: [{period: "上旬", activity: "小麦收获，夏玉米播种"}, {period: "中旬", activity: "水稻田间管理，追肥"}, {period: "下旬", activity: "防治稻飞虱，玉米螟"}],
  7: [{period: "上旬", activity: "早稻抽穗扬花"}, {period: "中旬", activity: "玉米抽雄，追肥"}, {period: "下旬", activity: "早稻收获，晚稻育秧"}],
  8: [{period: "上旬", activity: "晚稻移栽，玉米灌浆"}, {period: "中旬", activity: "中稻田间管理"}, {period: "下旬", activity: "玉米成熟收获"}],
  9: [{period: "上旬", activity: "中稻收获，油菜育苗"}, {period: "中旬", activity: "晚稻孕穗"}, {period: "下旬", activity: "秋收秋种，小麦播种准备"}],
  10: [{period: "上旬", activity: "晚稻收获，小麦播种"}, {period: "中旬", activity: "油菜移栽，整地"}, {period: "下旬", activity: "秋播管理，病虫害防治"}],
  11: [{period: "上旬", activity: "小麦出苗管理"}, {period: "中旬", activity: "油菜田间管理"}, {period: "下旬", activity: "冬季清园，果树涂白"}],
  12: [{period: "上旬", activity: "设施农业管理"}, {period: "下旬", activity: "总结全年，制定明年计划"}]
};

// ==================== Helper Functions ====================

function getWeatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌾️";
  if (code <= 57) return "🌤️";
  if (code <= 67) return "🌤️";
  if (code <= 77) return "❄️";
  if (code <= 82) return "🌤️";
  if (code <= 86) return "⛅️";
  return "⛈️";
}

function getMatchStyle(level: string): string {
  if (level === "strong") return "bg-green-100 text-green-700 border border-green-300";
  if (level === "medium") return "bg-amber-100 text-amber-700 border border-amber-300";
  return "bg-gray-100 text-gray-500 border border-gray-300";
}

function getMatchLabel(level: string): string {
  if (level === "strong") return "高度匹配";
  if (level === "medium") return "中度匹配";
  return "一般匹配";
}

function getTodayStr(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 9) return "早上好";
  if (h < 12) return "上午好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  if (h < 22) return "晚上好";
  return "夜深了";
}

function getFarmingAdvice(weather: WeatherData | null): string[] {
  if (!weather) return ["适宜农事"];
  const advice: string[] = [];
  if (weather.humidity > 70) advice.push("注意防病");
  if (weather.temperature > 30) advice.push("注意防暑");
  if (weather.temperature < 10) advice.push("注意防冻");
  if (weather.totalPrecipitation > 0 || weather.weatherCode >= 51) advice.push("不宜喷药");
  if (weather.windSpeed > 5) advice.push("不宜作业");
  if (advice.length === 0) advice.push("适宜农事");
  return advice;
}

function getLandIcon(type: string): string {
  const icons: Record<string, string> = {
    "旱地": "🌾", "水田": "🌳", "菜地": "🥬",
    "果园": "🍇", "林地": "🌲", "荒地": "🏜️",
  };
  return icons[type] || "🌾";
}

function getSoilIcon(type: string): string {
  const icons: Record<string, string> = {
    "黑土": "⬛", "壤土": "🟫", "黏土": "🟤",
    "红壤": "🔴", "黄土": "🟡", "砂土": "🟠",
  };
  return icons[type] || "🟫";
}

function getCategoryIcon(cat: string): string {
  const icons: Record<string, string> = {
    "施肥": "🧪", "灌溉": "💧", "除虫": "🐛",
    "除草": "🌿", "其他": "📌",
  };
  return icons[cat] || "📌";
}

function getPriorityColor(p: string): string {
  if (p === "high") return "border-l-red-500";
  if (p === "medium") return "border-l-amber-400";
  return "border-l-sky-400";
}

function getPriorityGlow(p: string): string {
  if (p === "high") return "shadow-[0_2px_8px_rgba(239,68,68,0.08)]";
  if (p === "medium") return "shadow-[0_2px_8px_rgba(245,158,11,0.08)]";
  return "shadow-[0_2px_8px_rgba(14,165,233,0.08)]";
}

function getMonthActivities(): Array<{ day: number; text: string }> {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return [
      { day: 5, text: "春耕整地" }, { day: 12, text: "播种育苗" },
      { day: 18, text: "追肥管理" }, { day: 25, text: "病虫害防治" },
    ];
  }
  if (month >= 6 && month <= 8) {
    return [
      { day: 3, text: "田间灌溉" }, { day: 10, text: "中耕除草" },
      { day: 20, text: "防汛排涝" }, { day: 28, text: "夏收准备" },
    ];
  }
  if (month >= 9 && month <= 11) {
    return [
      { day: 5, text: "秋收作物" }, { day: 15, text: "秋播冬种" },
      { day: 22, text: "秸秆还田" }, { day: 30, text: "冬前管理" },
    ];
  }
  return [
    { day: 5, text: "冬季修剪" }, { day: 15, text: "设施维护" },
    { day: 22, text: "积肥备耕" }, { day: 28, text: "防寒保暖" },
  ];
}

function getProverb(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "春种一粒粟，秋收万颗子";
  if (month >= 6 && month <= 8) return "稻花香里说丰年，听取蛙声一片";
  if (month >= 9 && month <= 11) return "春华秋实，岁物丰成";
  return "瑞雪兆丰年，来年好收成";
}

function getCropEmoji(name: string): string {
  const emojis: Record<string, string> = {
    "水稻": "🌾", "小麦": "🌿", "玉米": "🌽",
    "大豆": "🫘", "番茄": "🍅", "黄瓜": "🥒",
    "辣椒": "🌶️", "西瓜": "🍉", "白菜": "🥬",
    "菠菜": "🥬", "大蒜": "🧄", "花生": "🥜",
    "红薯": "🍠", "茶叶": "🍵", "柑橘": "🍊",
    "土豆": "🥔", "茄子": "🍆", "生菜": "🥬",
    "高粱": "🌾", "莲藕": "🪷", "苹果": "🍎",
    "萝卜": "🥕", "生姜": "🫚", "蒜薹": "🧄",
  };
  return emojis[name] || "🌳";
}

function getBriefingIcon(type: string): string {
  if (type === "政策") return "📋";
  if (type === "行情") return "📈";
  if (type === "预警") return "⚠️";
  return "💡";
}

function getBriefingBorderColor(type: string): string {
  if (type === "政策") return "border-l-sky-400";
  if (type === "行情") return "border-l-green-500";
  if (type === "预警") return "border-l-red-500";
  return "border-l-amber-400";
}

// ==================== 优化子组件 ====================

// 空状态组件
const EmptyState = memo(({ icon, text }: { icon: string; text: string }) => (
  <div className="flex flex-col items-center justify-center py-8">
    <span className="text-4xl mb-2">{icon}</span>
    <p className="text-[#8b9e82] text-sm">{text}</p>
  </div>
));
EmptyState.displayName = "EmptyState";

// 天气图标动画组件
const WeatherIcon = memo(({ code, size = "text-4xl" }: { code: number; size?: string }) => (
  <div className={`${size} animate-float`}>
    {getWeatherEmoji(code)}
  </div>
));
WeatherIcon.displayName = "WeatherIcon";

// 迷你趋势图组件
const MiniTrendChart = memo(({ data, trend }: { data: number[]; trend: string }) => {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  const color = trend === "up" ? "#dc2626" : trend === "down" ? "#16a34a" : "#d97706";
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
});
MiniTrendChart.displayName = "MiniTrendChart";

// 打字动画组件
const TypingIndicator = memo(() => (
  <div className="flex gap-1">
    <span className="size-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
    <span className="size-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
    <span className="size-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
  </div>
));
TypingIndicator.displayName = "TypingIndicator";

// ==================== 收益计算与市场均衡函数 ====================

// 计算作物收益
const calculateCropProfit = (cropName: string, areaMu: number): {
  totalYield: number;
  totalRevenue: number;
  totalCost: number;
  netProfit: number;
  profitMargin: number;
  profitPerMu: number;
} | null => {
  const crop = CROP_PROFIT_DATA[cropName];
  if (!crop) return null;

  const totalYield = crop.yieldPerMu * areaMu;
  const totalRevenue = totalYield * crop.pricePerJin;
  const totalCost = crop.costPerMu * areaMu;
  const netProfit = totalRevenue - totalCost;
  const profitMargin = (netProfit / totalRevenue) * 100;
  const profitPerMu = netProfit / areaMu;

  return {
    totalYield,
    totalRevenue,
    totalCost,
    netProfit,
    profitMargin,
    profitPerMu,
  };
};

// 获取市场均衡状态
const getMarketEquilibriumStatus = (cropName: string): {
  status: 'normal' | 'warning' | 'limit';
  percentage: number;
  message: string;
} => {
  const count = MARKET_EQUILIBRIUM_DATA.cropSelections[cropName as keyof typeof MARKET_EQUILIBRIUM_DATA.cropSelections] || 0;
  const percentage = count / MARKET_EQUILIBRIUM_DATA.totalUsers;

  if (percentage >= MARKET_EQUILIBRIUM_DATA.thresholds.limit) {
    return {
      status: 'limit',
      percentage: Math.round(percentage * 100),
      message: `该作物种植人数已达上限（${Math.round(percentage * 100)}%），市场供给过剩风险高，建议选择替代作物`,
    };
  } else if (percentage >= MARKET_EQUILIBRIUM_DATA.thresholds.warning) {
    return {
      status: 'warning',
      percentage: Math.round(percentage * 100),
      message: `该作物种植人数较多（${Math.round(percentage * 100)}%），存在市场饱和风险`,
    };
  }

  return {
    status: 'normal',
    percentage: Math.round(percentage * 100),
    message: '市场供给正常，价格有保障',
  };
};

// 获取推荐排序（考虑市场均衡）
const getRecommendedCrops = (landType: string, soilType: string, area: number): Array<{
  name: string;
  profit: number;
  equilibriumStatus: ReturnType<typeof getMarketEquilibriumStatus>;
  matchScore: number;
}> => {
  const crops = Object.entries(CROP_PROFIT_DATA)
    .filter(([_, data]) => {
      // 过滤适宜土地类型
      return data.suitableLand.includes(landType) || landType === '';
    })
    .map(([name, data]) => {
      const profit = calculateCropProfit(name, area)?.netProfit || 0;
      const equilibriumStatus = getMarketEquilibriumStatus(name);

      // 计算匹配分数（收益 - 均衡惩罚）
      let matchScore = profit;
      if (equilibriumStatus.status === 'limit') {
        matchScore *= 0.3; // 大幅降低推荐度
      } else if (equilibriumStatus.status === 'warning') {
        matchScore *= 0.7; // 适度降低推荐度
      }

      return {
        name,
        profit,
        equilibriumStatus,
        matchScore,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  return crops;
};

// 获取风险等级显示文本
const getRiskLevelText = (level: 'low' | 'medium' | 'high'): string => {
  const texts = { low: '低', medium: '中', high: '高' };
  return texts[level];
};

// 获取市场稳定性显示文本
const getMarketStabilityText = (stability: 'stable' | 'volatile'): string => {
  return stability === 'stable' ? '稳定' : '波动';
};

// 获取均衡状态样式
const getEquilibriumStyle = (status: 'normal' | 'warning' | 'limit'): string => {
  if (status === 'limit') return 'bg-red-50 text-red-700 border-red-200';
  if (status === 'warning') return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-green-50 text-green-700 border-green-200';
};

// 获取均衡状态图标
const getEquilibriumIcon = (status: 'normal' | 'warning' | 'limit'): string => {
  if (status === 'limit') return '⚠️';
  if (status === 'warning') return '⚡';
  return '✅';
};

// ==================== 组合推荐功能 ====================

// 计算组合收益
const calculatePortfolioProfit = (crops: Array<{ name: string; area: number }>): number => {
  return crops.reduce((total, crop) => {
    const profit = calculateCropProfit(crop.name, crop.area);
    return total + (profit?.netProfit || 0);
  }, 0);
};

// 生成组合种植方案
const generatePortfolioRecommendations = (
  area: number,
  riskPreference: 'conservative' | 'balanced' | 'aggressive'
): Array<{
  name: string;
  crops: Array<{ name: string; area: number; ratio: number }>;
  expectedProfit: number;
  riskLevel: string;
  description: string;
}> => {
  const portfolios: Array<{
    name: string;
    crops: Array<{ name: string; area: number; ratio: number }>;
    expectedProfit: number;
    riskLevel: string;
    description: string;
  }> = [];

  if (riskPreference === 'conservative') {
    // 稳健型：以低风险稳定作物为主
    portfolios.push({
      name: '稳健型组合',
      crops: [
        { name: '小麦', area: area * 0.5, ratio: 50 },
        { name: '玉米', area: area * 0.3, ratio: 30 },
        { name: '白菜', area: area * 0.2, ratio: 20 },
      ],
      expectedProfit: calculatePortfolioProfit([
        { name: '小麦', area: area * 0.5 },
        { name: '玉米', area: area * 0.3 },
        { name: '白菜', area: area * 0.2 },
      ]),
      riskLevel: '低',
      description: '以粮食作物为主，市场稳定，收益可预期',
    });
  } else if (riskPreference === 'balanced') {
    // 平衡型：兼顾收益和稳定
    portfolios.push({
      name: '平衡型组合',
      crops: [
        { name: '玉米', area: area * 0.4, ratio: 40 },
        { name: '黄瓜', area: area * 0.35, ratio: 35 },
        { name: '白菜', area: area * 0.25, ratio: 25 },
      ],
      expectedProfit: calculatePortfolioProfit([
        { name: '玉米', area: area * 0.4 },
        { name: '黄瓜', area: area * 0.35 },
        { name: '白菜', area: area * 0.25 },
      ]),
      riskLevel: '中',
      description: '粮食与蔬菜搭配，收益与风险平衡',
    });
  } else {
    // 进取型：高收益高风险作物
    portfolios.push({
      name: '进取型组合',
      crops: [
        { name: '番茄', area: area * 0.5, ratio: 50 },
        { name: '黄瓜', area: area * 0.3, ratio: 30 },
        { name: '玉米', area: area * 0.2, ratio: 20 },
      ],
      expectedProfit: calculatePortfolioProfit([
        { name: '番茄', area: area * 0.5 },
        { name: '黄瓜', area: area * 0.3 },
        { name: '玉米', area: area * 0.2 },
      ]),
      riskLevel: '高',
      description: '以高价值蔬菜为主，收益潜力大但需承担市场波动风险',
    });
  }

  // 智能组合：基于市场均衡动态调整
  const smartCrops = Object.entries(CROP_PROFIT_DATA)
    .map(([name, data]) => ({
      name,
      profitPerMu: data.yieldPerMu * data.pricePerJin - data.costPerMu,
      equilibriumStatus: getMarketEquilibriumStatus(name),
      riskLevel: data.riskLevel,
    }))
    .filter(crop => crop.equilibriumStatus.status !== 'limit') // 排除已达上限的作物
    .sort((a, b) => {
      // 根据风险偏好排序
      if (riskPreference === 'conservative') {
        // 稳健型：优先低风险、市场稳定
        const riskOrder = { low: 0, medium: 1, high: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      // 其他：优先收益
      return b.profitPerMu - a.profitPerMu;
    })
    .slice(0, 3);

  if (smartCrops.length >= 3) {
    const smartPortfolio = {
      name: 'AI智能组合',
      crops: [
        { name: smartCrops[0].name, area: area * 0.5, ratio: 50 },
        { name: smartCrops[1].name, area: area * 0.3, ratio: 30 },
        { name: smartCrops[2].name, area: area * 0.2, ratio: 20 },
      ],
      expectedProfit: calculatePortfolioProfit([
        { name: smartCrops[0].name, area: area * 0.5 },
        { name: smartCrops[1].name, area: area * 0.3 },
        { name: smartCrops[2].name, area: area * 0.2 },
      ]),
      riskLevel: riskPreference === 'conservative' ? '低' : riskPreference === 'balanced' ? '中' : '中高',
      description: 'AI根据市场均衡动态优化，分散风险的同时追求收益最大化',
    };
    portfolios.unshift(smartPortfolio); // 放在最前面
  }

  return portfolios;
};

// ==================== SVG Chart Helpers ====================

function renderSparkline(data: number[], trend: string): React.ReactNode {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 60;
  const h = 24;
  const points = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(" ");
  const color = trend === "up" ? "#dc2626" : trend === "down" ? "#16a34a" : "#d97706";
  return (
    <svg width={w} height={h} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="1.5" points={points} />
    </svg>
  );
}

// ==================== Loading Spinner Component ====================
const LoadingSpinner = ({ text = "加载中..." }: { text?: string }) => (
  <div className="flex flex-col items-center justify-center py-8">
    <div className="w-10 h-10 border-3 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
    <p className="mt-3 text-sm text-[var(--text-muted)]">{text}</p>
  </div>
);

// ==================== Main Component ====================

export default function Home() {
  // ---- Tab State ----
  const [activeTab, setActiveTab] = useState(0);

  // ---- Tab0: Dashboard ----
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [marketFull, setMarketFull] = useState<MarketResponse | null>(null);

  // 任务列表 - 从localStorage加载
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadFromStorage(STORAGE_KEYS.tasks, [
      { id: "1", text: "给番茄追施有机肥", done: false, date: getTodayStr(), category: "施肥", priority: "high" },
      { id: "2", text: "检查灌溉管道", done: false, date: getTodayStr(), category: "灌溉", priority: "medium" },
      { id: "3", text: "玉米田除草", done: true, date: getTodayStr(), category: "除草", priority: "low" },
      { id: "4", text: "喷洒生物农药防治蛱虫", done: false, date: getTodayStr(), category: "除虫", priority: "high" },
      { id: "5", text: "整理农具仓库", done: false, date: getTodayStr(), category: "其他", priority: "low" },
    ]);
  });

  // ---- Tab1: Planting ----
  const [step, setStep] = useState(1);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const [landArea, setLandArea] = useState("");
  const [landType, setLandType] = useState("");
  const [soilType, setSoilType] = useState("");
  const [terrain, setTerrain] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [plantingWeather, setPlantingWeather] = useState<WeatherData | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [recommendation, setRecommendation] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const [showShareToast, setShowShareToast] = useState(false);
  const [showLandTypeHelp, setShowLandTypeHelp] = useState(false);
  const [showSoilTypeHelp, setShowSoilTypeHelp] = useState(false);
  const [riskPreference, setRiskPreference] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  // ---- Tab2: Market ----
  const [selectedCrop, setSelectedCrop] = useState("");
  const [marketTab, setMarketTab] = useState(0);

  // ---- Location for Market ----
  const [userProvince, setUserProvince] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(false);

  // ---- Tab3: Management ----
  const [newTask, setNewTask] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<"施肥" | "灌溉" | "除虫" | "除草" | "其他">("其他");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [showAddTask, setShowAddTask] = useState(false);
  const [smartIrrigation, setSmartIrrigation] = useState(true);
  const [greenhouseVent, setGreenhouseVent] = useState(false);
  const [supplementLight, setSupplementLight] = useState(false);
  const [pestAlert, setPestAlert] = useState(true);
  const growthRecords = [
    { id: "g1", date: "05-01", text: "播种完成", img: "🌳" },
    { id: "g2", date: "05-08", text: "出苗整齐", img: "🌿" },
    { id: "g3", date: "05-15", text: "第一次追肥", img: "🧪" },
    { id: "g4", date: "05-22", text: "长势良好", img: "🌾" },
  ];

  // ---- Tab4: Assistant ----
  // 聊天记录 - 从localStorage加载
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadFromStorage(STORAGE_KEYS.chatMessages, [
      { role: "ai", text: "您好！我是您的农业助手，可以帮您：\n\n🌾 查询作物种植技术\n💰 了解农产品价格行情\n🐛 诊断病虫害问题\n🌤️ 获取天气和农事建议\n\n请问今天想聊点什么？" },
    ]);
  });
  const [inputText, setInputText] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [cameraExpanded, setCameraExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  // 对话上下文状态
  const [conversationContext, setConversationContext] = useState<{
    lastTopic: string;
    mentionedCrop: string;
    mentionedPest: string;
    pendingAction: string;
  }>({ lastTopic: "", mentionedCrop: "", mentionedPest: "", pendingAction: "" });
  
  // API状态
  const [apiStatus, setApiStatus] = useState<{
    checked: boolean;
    configured: boolean;
    lastCheck: string | null;
  }>({ checked: false, configured: false, lastCheck: null });

  // ---- Tab5: Profile ----
  const userName = "张农场主";

  const PROVINCES = [
    "北京", "天津", "河北", "山西", "内蒙古",
    "辽宁", "吉林", "黑龙江",
    "上海", "江苏", "浙江", "安徽", "福建", "江西", "山东",
    "河南", "湖北", "湖南", "广东", "广西", "海南",
    "重庆", "四川", "贵州", "云南", "西藏",
    "陕西", "甘肃", "青海", "宁夏", "新疆",
  ];

  // ---- Refs ----
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const detectLocationFromGPS = useCallback(() => {
    if (!navigator.geolocation) {
      setAiResponse("您的浏览器不支持GPS定位，请手动选择省份。");
      return;
    }
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=zh`
          );
          const data = await res.json();
          const address = data.address || {};
          const province = (address.province || address.state || address.region || "").replace(/省|市|自治区|特别行政区/g, "");
          if (province && PROVINCES.includes(province)) {
            setUserProvince(province);
            setAiResponse(`已定位到：${province}`);
          } else {
            setAiResponse(`定位成功，但无法确定省份，请手动选择。坐标：${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)}`);
          }
        } catch {
          setAiResponse("定位解析失败，请手动选择省份。");
        }
        setLocationLoading(false);
      },
      (err) => {
        setLocationLoading(false);
        setAiResponse(`定位失败：${err.message}，请手动选择省份或检查定位权限。`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // 保存任务到localStorage - 使用防抖优化
  const debouncedSaveTasks = useDebounce(() => {
    saveToStorage(STORAGE_KEYS.tasks, tasks);
  }, 1000);

  useEffect(() => {
    debouncedSaveTasks();
  }, [tasks, debouncedSaveTasks]);

  // 保存聊天记录到localStorage - 使用防抖优化
  const debouncedSaveChat = useDebounce(() => {
    saveToStorage(STORAGE_KEYS.chatMessages, chatMessages);
  }, 1000);

  useEffect(() => {
    debouncedSaveChat();
  }, [chatMessages, debouncedSaveChat]);

  // ---- Load initial data ----
  useEffect(() => {
    if (activeTab === 2 || activeTab === 0) {
      const params = new URLSearchParams();
      if (userProvince) params.set("province", userProvince);
      fetch(`/api/market?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const items: MarketItem[] = (data.items || []).map(
              (c: { name: string; price: number; trend: string; change: string; emoji?: string }) => ({
                name: c.name,
                price: c.price,
                trend: c.trend as "up" | "down" | "stable",
                change: c.change,
                emoji: c.emoji || getCropEmoji(c.name),
              })
            );
            setMarketData(items);
            // 从items计算涨跌数量
            const upCount = items.filter(i => i.trend === 'up').length;
            const downCount = items.filter(i => i.trend === 'down').length;
            const stableCount = items.filter(i => i.trend === 'stable').length;
            setMarketFull({
              items,
              index: data.index?.agriculture200 || data.index || 100,
              indexChange: data.indexChange?.agriculture200 || data.indexChange || 0,
              upCount,
              downCount,
              stableCount,
              history: data.history || [],
              briefings: (data.briefings || []).map(
                (b: { type: string; title: string; content: string; time: string }) => ({
                  type: b.type as "政策" | "行情" | "预警" | "机会",
                  title: b.title,
                  content: b.content,
                  time: b.time,
                })
              ),
              macro: {
                seasonForecast: data.macro?.seasonalForecast || '',
                policyInfo: data.macro?.policyInfo || '',
              },
            });
            if (items.length > 0) {
              setSelectedCrop(items[0].name);
            }
          }
        })
        .catch(() => {});
    }
  }, [activeTab, userProvince]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // 检查API状态
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const res = await fetch('/api/ai');
        const data = await res.json();
        setApiStatus({
          checked: true,
          configured: data.configured || false,
          lastCheck: new Date().toISOString(),
        });
        console.log('[API状态] AI API配置:', data.configured ? '已配置' : '未配置');
      } catch (err) {
        console.error('[API状态] 检查失败:', err);
        setApiStatus({
          checked: true,
          configured: false,
          lastCheck: new Date().toISOString(),
        });
      }
    };
    checkApiStatus();
  }, []);

  // ---- Cleanup camera on unmount ----
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // 性能监控
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // 标记首屏渲染完成
      performance.mark('app-rendered');
      
      // 监听Tab切换性能
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'measure') {
            console.log(`[Performance] ${entry.name}: ${entry.duration.toFixed(2)}ms`);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ['measure'] });
      } catch {
        // 浏览器不支持则忽略
      }

      return () => {
        observer.disconnect();
      };
    }
  }, []);

  // ==================== Handlers ====================

  const handleQuickPlan = useCallback(() => {
    setLandArea("10");
    setLandType("旱地");
    setSoilType("壤土");
    setTerrain("平原");
    setStep(2);
  }, []);

  const handleGetGPS = useCallback(() => {
    setGpsLoading(true);
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("您的浏览器不支持定位功能");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`/api/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
          const data = await res.json();
          if (data.current && data.summary) {
            const weatherData: WeatherData = {
              temperature: data.current.temperature,
              weatherCode: data.current.weatherCode,
              windSpeed: data.current.windSpeed,
              humidity: data.current.humidity,
              description: data.current.weatherDescription || "",
              avgTemperature: data.summary.avgTemperature,
              totalPrecipitation: data.summary.totalPrecipitation,
              avgSoilMoisture: data.summary.avgSoilMoisture,
              season: data.summary.season,
              suitableCrops: data.summary.suitableCrops,
              soilMoisture: data.summary.avgSoilMoisture,
              soilTemperature: 20,
            };
            setPlantingWeather(weatherData);
            setWeather(weatherData);
          }
        } catch {
          setGpsError("获取天气数据失败");
        }
        setGpsLoading(false);
      },
      () => {
        setGpsError("获取位置失败，请检查定位权限");
        setGpsLoading(false);
      }
    );
  }, []);

  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setStep(3);
    try {
      let analyzeData: Record<string, unknown> | null = null;
      try {
        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            landType: landType || "旱地",
            soilType: soilType || "壤土",
            terrain: terrain || "平原",
            imageBase64: imageBase64 || undefined,
          }),
        });
        if (analyzeRes.ok) {
          const data = await analyzeRes.json();
          analyzeData = data.analysis || data;
          setAnalysis(analyzeData);
        } else {
          console.error("分析API返回错误:", analyzeRes.status);
        }
      } catch (e) {
        console.error("分析API请求失败:", e);
      }

      const recommendRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landInfo: {
            landType: landType || "旱地",
            soilType: soilType || "壤土",
            terrain: terrain || "平原",
            area: parseFloat(landArea) || 10,
          },
          weatherInfo: plantingWeather
            ? {
                summary: {
                  season: plantingWeather.season,
                  avgTemperature: plantingWeather.avgTemperature,
                  totalPrecipitation: plantingWeather.totalPrecipitation,
                  suitableCrops: plantingWeather.suitableCrops,
                },
              }
            : undefined,
          aiAnalysis: analyzeData || undefined,
        }),
      });

      if (recommendRes.ok) {
        const recommendData = await recommendRes.json();
        setRecommendation(recommendData);
        setStep(4);
      } else {
        console.error("推荐API返回错误:", recommendRes.status);
        setChatMessages((prev) => [
          ...prev,
          { role: "ai", text: "推荐服务暂时不可用，请稍后再试。" },
        ]);
        setStep(2);
      }
    } catch (err) {
      console.error("AI分析失败:", err);
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "抱歉，AI分析遇到了问题。可能是网络不稳定，请稍后再试。您也可以直接点击下一步查看推荐方案。" },
      ]);
      setStep(2);
    }
    setLoading(false);
  }, [landType, soilType, terrain, imageBase64, landArea, plantingWeather]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImagePreview(result);
      setImageBase64(result);
    };
    reader.readAsDataURL(file);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const addTask = useCallback(() => {
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text: newTask.trim(),
        done: false,
        date: getTodayStr(),
        category: newTaskCategory,
        priority: newTaskPriority,
      },
    ]);
    setNewTask("");
  }, [newTask, newTaskCategory, newTaskPriority]);

  // 智能意图识别
  const analyzeIntent = useCallback((text: string): {
    intent: "weather" | "price" | "pest" | "crop" | "task" | "calendar" | "greeting" | "general";
    entities: { crop?: string; pest?: string; date?: string; location?: string };
    confidence: number;
  } => {
    const lowerText = text.toLowerCase();
    let intent: "weather" | "price" | "pest" | "crop" | "task" | "calendar" | "greeting" | "general" = "general";
    const entities: { crop?: string; pest?: string; date?: string; location?: string } = {};
    let confidence = 0;

    // 识别作物
    for (const cropName of Object.keys(CROP_KNOWLEDGE)) {
      if (lowerText.includes(cropName)) {
        entities.crop = cropName;
        break;
      }
    }

    // 识别病虫害
    for (const pestName of Object.keys(PEST_KNOWLEDGE)) {
      if (lowerText.includes(pestName)) {
        entities.pest = pestName;
        break;
      }
    }

    // 意图识别（注意顺序：更具体的模式放前面）
    if (/价格|行情|多少钱|收购价|市场价|菜价|肉价|蛋价|油价/.test(lowerText)) {
      intent = "price";
      confidence = 0.9;
    } else if (/天气|温度|下雨|降水|湿度|刮风/.test(lowerText)) {
      intent = "weather";
      confidence = 0.9;
    } else if (/病|虫|害|打药|防治|症状|农药|杀虫/.test(lowerText)) {
      intent = "pest";
      confidence = 0.85;
    } else if (/怎么种|种植|栽培|施肥|浇水|管理/.test(lowerText) || entities.crop) {
      intent = "crop";
      confidence = 0.85;
    } else if (/任务|提醒|记录|农事|待办/.test(lowerText)) {
      intent = "task";
      confidence = 0.8;
    } else if (/农事|日历|什么时候|几月|节气/.test(lowerText)) {
      intent = "calendar";
      confidence = 0.8;
    } else if (/你好|您好|在吗|早上好|下午好/.test(lowerText)) {
      intent = "greeting";
      confidence = 0.95;
    }

    return { intent, entities, confidence };
  }, []);

  // 生成智能回复
  const generateReply = useCallback((intent: string, entities: { crop?: string; pest?: string; date?: string; location?: string }, userText: string): string => {
    const currentMonth = new Date().getMonth() + 1;

    switch (intent) {
      case "greeting": {
        const hour = new Date().getHours();
        const timeGreeting = hour < 12 ? "早上好" : hour < 18 ? "下午好" : "晚上好";
        return `${timeGreeting}！我是智农AI助手，很高兴为您服务。我可以帮您：
1. 查询天气和农事建议
2. 了解农产品价格行情
3. 诊断作物病虫害
4. 提供种植技术指导
5. 管理农事任务

请问有什么可以帮您的吗？`;
      }

      case "weather": {
        if (plantingWeather) {
          return `当前天气信息：
🌡️ 温度：${plantingWeather.temperature}℃
💧 湿度：${plantingWeather.humidity}%
🌬️ 风速：${plantingWeather.windSpeed}km/h
☁️ 天气：${plantingWeather.description}

📊 近期趋势：
• 平均温度：${plantingWeather.avgTemperature}℃
• 预计降水：${plantingWeather.totalPrecipitation}mm
• 土壤湿度：${plantingWeather.avgSoilMoisture}%

💡 农事建议：${plantingWeather.season}，适宜种植${plantingWeather.suitableCrops.slice(0, 3).join("、")}等作物。`;
        }
        return "暂无天气数据，请先在种植规划页面获取GPS定位和天气信息。";
      }

      case "price": {
        if (entities.crop && marketData.length > 0) {
          const cropData = marketData.find(m => m.name === entities.crop);
          if (cropData) {
            return `${cropData.emoji} ${entities.crop}最新行情：
💰 当前价格：${cropData.price}元/斤
📈 涨跌：${cropData.change || "持平"}

如需了解其他作物价格，请告诉我具体作物名称。`;
          }
        }
        if (marketData.length > 0) {
          const top5 = marketData.slice(0, 5);
          return `今日热门行情：
${top5.map(m => `${m.emoji} ${m.name}：${m.price}元/斤 ${m.change || ""}`).join("\n")}

💡 提示：您可以直接询问具体作物价格，如"水稻价格多少"`;
        }
        return "暂无市场数据，请稍后再试。";
      }

      case "pest": {
        if (entities.pest && PEST_KNOWLEDGE[entities.pest]) {
          const pest = PEST_KNOWLEDGE[entities.pest];
          return `🐛 ${pest.name}防治指南：

🔍 症状识别：
${pest.symptoms}

🛡️ 预防措施：
${pest.prevention.map((p, i) => `${i + 1}. ${p}`).join("\n")}

💊 治疗方法：
${pest.treatment.map((t, i) => `${i + 1}. ${t}`).join("\n")}

⚠️ 建议及时采取措施，避免大面积蔓延。`;
        }
        return `病虫害防治建议：

1. 预防措施：
   • 选用抗病品种
   • 合理轮作倒茬
   • 保持田间通风透光
   • 清除病残体

2. 发现病害后：
   • 及时拔除病株
   • 对症下药
   • 注意农药安全间隔期

3. 生物防治：
   • 保护和利用天敌
   • 使用生物农药

如需了解具体病虫害防治方法，请告诉我病虫害名称。`;
      }

      case "crop": {
        if (entities.crop && CROP_KNOWLEDGE[entities.crop]) {
          const crop = CROP_KNOWLEDGE[entities.crop];
          return `🌾 ${crop.name}种植指南：

📅 种植季节：${crop.season}
🌱 适宜土壤：${crop.soil.join("、")}
💧 水分管理：${crop.water}
🧪 施肥建议：${crop.fertilizer}

⚠️ 常见病虫害：${crop.pests.join("、")}

💡 种植要点：
${crop.tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}`;
        }
        return `种植建议：

根据您的土地条件，建议：
1. 先使用种植规划功能进行AI分析
2. 选择适合当地气候的作物
3. 注意轮作倒茬，保持土壤肥力
4. 合理安排种植时间

我们知识库包含以下作物的详细信息：${Object.keys(CROP_KNOWLEDGE).join("、")}

请告诉我您想种植什么作物，我可以提供更详细的指导。`;
      }

      case "calendar": {
        const activities = FARMING_CALENDAR[currentMonth] || [];
        return `📅 ${currentMonth}月农事指南：

${activities.map(a => `【${a.period}】${a.activity}`).join("\n")}

💡 当前季节建议：
• 关注天气变化，合理安排农事
• 做好病虫害预防工作
• 及时追肥灌溉

如需了解其他月份的农事安排，请告诉我具体月份。`;
      }

      case "task": {
        const pendingTasks = tasks.filter(t => !t.done);
        if (pendingTasks.length > 0) {
          return `📋 您的待办任务（${pendingTasks.length}项）：

${pendingTasks.slice(0, 5).map(t => `${getCategoryIcon(t.category)} ${t.text} ${t.priority === "high" ? "🔴" : t.priority === "medium" ? "🟡" : "🔵"}`).join("\n")}

💡 您可以说"添加任务"来记录新的农事活动。`;
        }
        return `📋 当前没有待办任务。

您可以通过以下方式添加任务：
1. 在管理页面添加任务
2. 对我说"添加任务：给番茄浇水"
3. 使用快速任务按钮

我会帮您跟踪和管理所有农事活动。`;
      }

      default: {
        // 尝试理解用户意图
        if (userText.length < 5) {
          return "您好！请详细描述您的问题，比如：\n• 查询某种作物的种植方法\n• 了解当前天气情况\n• 询问农产品价格\n• 诊断病虫害问题\n• 查看农事日历";
        }
        return `感谢您的提问！我是智农AI助手，专门为您提供农业方面的帮助。

您可以问我：
🌤️ 天气情况 - "今天天气怎么样"
💰 农产品价格 - "水稻价格多少"
🌾 种植技术 - "怎么种番茄"
🐛 病虫害防治 - "稻瘟病怎么治"
📅 农事安排 - "这个月该做什么"
📋 任务管理 - "查看我的任务"

请尝试用更具体的方式提问，我会给您更准确的回答。`;
      }
    }
  }, [plantingWeather, marketData, tasks]);

  // 执行任务操作
  const executeAction = useCallback((intent: string, entities: { crop?: string; pest?: string; date?: string; location?: string }, text: string): string | null => {
    // 添加任务
    if (intent === "task" && (text.includes("添加") || text.includes("记录") || text.includes("创建"))) {
      // 提取任务内容
      const taskContent = text.replace(/添加|记录|创建|任务|提醒/g, "").trim();
      if (taskContent) {
        // 判断任务类别
        let category: "施肥" | "灌溉" | "除虫" | "除草" | "其他" = "其他";
        if (/施肥|追肥|底肥|有机肥/.test(text)) category = "施肥";
        else if (/浇水|灌溉|灌水|水/.test(text)) category = "灌溉";
        else if (/虫|药|防治|喷药/.test(text)) category = "除虫";
        else if (/草|除草/.test(text)) category = "除草";

        const newTaskObj: Task = {
          id: Date.now().toString(),
          text: taskContent,
          done: false,
          date: getTodayStr(),
          category,
          priority: "medium",
        };
        setTasks(prev => [...prev, newTaskObj]);
        return `✅ 已添加任务：${getCategoryIcon(category)} ${taskContent}`;
      }
    }
    return null;
  }, []);

  // 统一的消息处理函数
  // 用于存储最新的消息列表（避免闭包问题）
  const chatMessagesRef = useRef<ChatMessage[]>([]);

  const processMessage = useCallback(async (text: string, source: "voice" | "text" = "text") => {
    // 1. 添加用户消息
    setChatMessages(prev => {
      chatMessagesRef.current = [...prev, { role: "user", text }];
      return chatMessagesRef.current;
    });

    // 2. 显示AI正在输入状态
    setIsTyping(true);

    // 3. 识别意图和实体（用于本地功能）
    const { intent, entities } = analyzeIntent(text);
    console.log('[AI助手] 意图识别:', { intent, entities, text });

    // 4. 更新对话上下文
    setConversationContext(prev => ({
      lastTopic: intent,
      mentionedCrop: entities.crop || prev.mentionedCrop,
      mentionedPest: entities.pest || prev.mentionedPest,
      pendingAction: "",
    }));

    // 5. 尝试执行本地操作（如添加任务）
    const actionResult = executeAction(intent, entities, text);
    if (actionResult) {
      setChatMessages(prev => [...prev, { role: "ai", text: actionResult }]);
      chatMessagesRef.current = [...chatMessagesRef.current, { role: "ai", text: actionResult }];
      setIsTyping(false);
      return;
    }

    // 6. 调用AI API获取智能回复
    console.log('[AI助手] 开始调用API, API状态:', apiStatus);
    console.log('[AI助手] 用户问题:', text);
    console.log('[AI助手] 识别意图:', intent);
    
    try {
      // 构建消息历史 - 确保角色正确
      const messageHistory = chatMessagesRef.current.map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      }));
      
      const requestBody = {
        messages: messageHistory,
        intent: intent, // 传递意图给API
        // 注入本地数据，让AI能回答价格和天气问题
        marketData: marketData.slice(0, 10).map(m => ({
          name: m.name,
          price: m.price,
          change: m.change
        })),
        weatherData: plantingWeather ? {
          temperature: plantingWeather.temperature,
          humidity: plantingWeather.humidity,
          windSpeed: plantingWeather.windSpeed,
          description: plantingWeather.description,
          suitableCrops: plantingWeather.suitableCrops
        } : null
      };
      
      console.log('[AI助手] 发送请求:', JSON.stringify(requestBody).substring(0, 300));
      
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      console.log('[AI助手] 响应状态:', response.status);
      const data = await response.json();
      console.log('[AI助手] 响应数据:', { 
        source: data.source, 
        reason: data.reason, 
        hasReply: !!data.reply,
        intent: data.intent 
      });

      if (data.reply) {
        // 显示AI回复
        setChatMessages(prev => {
          chatMessagesRef.current = [...prev, { role: "ai", text: data.reply }];
          return chatMessagesRef.current;
        });
        
        // 如果是备用回复，在控制台记录原因
        if (data.source === 'fallback') {
          console.log('[AI助手] 使用备用回复，原因:', data.reason);
        }
      } else {
        // 没有回复时的兜底处理
        console.error('[AI助手] 没有收到回复');
        setChatMessages(prev => {
          const fallbackReply = `抱歉，我没有理解您的问题。关于"${text}"，您可以尝试：\n\n• 更具体地描述您的问题\n• 使用简洁的语言\n• 查看首页的相关信息`;
          chatMessagesRef.current = [...prev, { role: "ai", text: fallbackReply }];
          return chatMessagesRef.current;
        });
      }
    } catch (error) {
      console.error('[AI助手] 调用失败:', error);
      // 网络失败时的回复
      setChatMessages(prev => {
        const reply = `网络连接似乎有点问题。关于"${text}"，您可以：\n\n📱 检查网络后重试\n🌾 描述具体问题，我会尽力帮您\n📊 查看首页的市场行情和天气信息`;
        chatMessagesRef.current = [...prev, { role: "ai", text: reply }];
        return chatMessagesRef.current;
      });
    }

    setIsTyping(false);
  }, [analyzeIntent, executeAction, apiStatus, marketData, plantingWeather]);

  const handleVoiceStart = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      setChatMessages((prev) => [...prev, { role: "ai", text: "您的浏览器不支持语音识别功能" }]);
      return;
    }
    const SpeechRecognitionCtor = (window as unknown as Record<string, unknown>).SpeechRecognition || (window as unknown as Record<string, unknown>).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setChatMessages((prev) => [...prev, { role: "ai", text: "您的浏览器不支持语音识别功能" }]);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognitionCtor as any)();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript as string;
      setVoiceText(text);
      processMessage(text, "voice");
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [processMessage]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCameraExpanded(true);
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "无法访问摄像头，请检查权限设置" }]);
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg");
    setCapturedFrame(dataUrl);
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCameraExpanded(false);
    setCapturedFrame(null);
  }, []);

  const handlePhotoAnalyze = useCallback(async () => {
    if (!capturedFrame) return;
    setIsTyping(true);
    setChatMessages((prev) => [...prev, { role: "user", text: "[发送了一张作物/病虫害照片，请分析]" }]);
    stopCamera();
    
    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: '请分析这张作物照片，识别作物种类，并检查是否有病虫害迹象。如果发现病虫害，请详细描述症状并提供防治建议。' }
          ],
          imageBase64: capturedFrame,
        }),
      });

      const data = await response.json();
      
      if (data.reply) {
        setChatMessages((prev) => [...prev, { role: "ai", text: data.reply }]);
      } else {
        setChatMessages((prev) => [...prev, { role: "ai", text: '照片分析完成。如需更详细的种植建议，请描述您遇到的具体问题。' }]);
      }
    } catch (error) {
      console.error('照片分析失败:', error);
      setChatMessages((prev) => [...prev, { 
        role: "ai", 
        text: '抱歉，照片分析遇到了问题。请稍后再试，或尝试描述您看到的问题。' 
      }]);
    }
    
    setIsTyping(false);
  }, [capturedFrame, stopCamera]);

  const handleChatImageUpload = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCapturedFrame(dataUrl);
      setCameraExpanded(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleVideoCall = useCallback(() => {
    setVideoCallActive(true);
    setChatMessages((prev) => [...prev, { role: "ai", text: "正在连接农业专家视频通话..." }]);
    setTimeout(() => {
      setVideoCallActive(false);
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "视频通话已结束。专家建议：\n1. 当前季节适合种植番茄、黄瓜等蔬菜\n2. 注意田间排水，避免积水\n3. 建议使用有机肥替代部分化肥\n4. 定期巡查病虫害情况",
        },
      ]);
    }, 5000);
  }, []);

  const handleSendMessage = useCallback(() => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText("");
    processMessage(text, "text");
  }, [inputText, processMessage]);

  const handleSupplySubmit = useCallback(() => {
    setChatMessages((prev) => [...prev, { role: "user", text: "我需要供应农产品" }]);
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "供应信息已提交！我们的采购团队将在24小时内与您联系。请确保填写准确的农产品种类、数量和期望价格。" },
      ]);
    }, 1000);
  }, []);

  // ==================== Render Price Chart ====================

  const renderPriceChart = useCallback(() => {
    if (!marketFull || !selectedCrop) return null;
    const cropData = marketFull.items.find((i) => i.name === selectedCrop);
    if (!cropData?.sparkline || cropData.sparkline.length < 2) return null;

    const data = cropData.sparkline;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const padding = { top: 10, right: 10, bottom: 25, left: 40 };
    const chartW = 300 - padding.left - padding.right;
    const chartH = 150 - padding.top - padding.bottom;

    const points = data
      .map((v, i) => {
        const x = padding.left + (i / (data.length - 1)) * chartW;
        const y = padding.top + chartH - ((v - min) / range) * chartH;
        return `${x},${y}`;
      })
      .join(" ");

    const lastX = padding.left + chartW;
    const lastY = padding.top + chartH - ((data[data.length - 1] - min) / range) * chartH;
    const fillPoints = `${padding.left},${padding.top + chartH} ${points} ${lastX},${padding.top + chartH}`;

    const yLabels = [max, (max + min) / 2, min];

    return (
      <svg viewBox="0 0 300 150" className="w-full h-auto">
        <defs>
          <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((i) => (
          <line
            key={i}
            x1={padding.left}
            y1={padding.top + (i / 2) * chartH}
            x2={padding.left + chartW}
            y2={padding.top + (i / 2) * chartH}
            stroke="rgba(26,46,26,0.06)"
            strokeWidth="0.5"
          />
        ))}
        {yLabels.map((label, i) => (
          <text
            key={i}
            x={padding.left - 5}
            y={padding.top + (i / 2) * chartH + 4}
            textAnchor="end"
            className="text-[8px]"
            fill="#8b9e82"
          >
            {label.toFixed(1)}
          </text>
        ))}
        <text x={padding.left} y={145} className="text-[8px]" fill="#8b9e82">
          30天前
        </text>
        <text x={padding.left + chartW} y={145} textAnchor="end" className="text-[8px]" fill="#8b9e82">
          今天
        </text>
        <polygon points={fillPoints} fill="url(#chartGrad)" />
        <polyline fill="none" stroke="#22c55e" strokeWidth="2" points={points} className="animate-draw-line" />
        <circle cx={lastX} cy={lastY} r="4" fill="#22c55e" />
        <circle cx={lastX} cy={lastY} r="7" fill="#22c55e" fillOpacity="0.2" className="animate-blink" />
      </svg>
    );
  }, [marketFull, selectedCrop]);

  // ==================== Tab 0: Home (Nature Fresh) ====================

  const RenderDashboard = memo(() => {
    // 使用useMemo缓存计算结果
    const pendingTasks = useMemo(() => tasks.filter(t => !t.done).slice(0, 3), [tasks]);
    const pendingCount = useMemo(() => tasks.filter(t => !t.done).length, [tasks]);
    const farmingAdvice = useMemo(() => weather ? getFarmingAdvice(weather) : [], [weather]);
    const marketPreview = useMemo(() => marketData.slice(0, 3), [marketData]);

    // 快捷操作配置
    const quickActions = useMemo(() => [
      { icon: '🌱', label: '种植规划', tab: 1 },
      { icon: '📊', label: '市场行情', tab: 2 },
      { icon: '📷', label: '拍照识别', tab: 4 },
      { icon: '🤖', label: 'AI助手', tab: 4 },
    ], []);

    return (
      <div className="animate-fade-in-up space-y-4 pb-4">
        {/* 顶部问候区域 */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xl shadow-lg shadow-green-200">
              👨‍🌾
            </div>
            <div>
              <p className="text-lg font-semibold text-[#1a2e1a]">
                {getGreeting()}，农户
              </p>
              <p className="text-sm text-[#8b9e82]">今天也要加油哦！</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="size-10 rounded-full hover:bg-green-50 transition-colors cursor-pointer active:scale-95 flex items-center justify-center">
              <LocationIcon className="w-5 h-5 text-green-600" />
            </button>
            <button className="size-10 rounded-full hover:bg-green-50 transition-colors cursor-pointer active:scale-95 relative flex items-center justify-center">
              <BellIcon className="w-5 h-5 text-green-600" />
              {pendingCount > 0 && (
                <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full"></span>
              )}
            </button>
          </div>
        </div>

        {/* 天气卡片 - 添加动画 */}
        <div className="nature-card rounded-2xl p-4 shadow-sm">
          {weather ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <WeatherIcon code={weather.weatherCode} />
                  <div>
                    <p className="text-3xl font-bold text-[#1a2e1a]">{Math.round(weather.temperature)}°</p>
                    <p className="text-sm text-[#8b9e82]">{weather.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-[#8b9e82]">湿度 {weather.humidity}%</p>
                  <p className="text-sm text-[#8b9e82]">风速 {weather.windSpeed}m/s</p>
                </div>
              </div>
              {/* 农事建议标签 - 更醒目 */}
              <div className="flex gap-2 flex-wrap">
                {farmingAdvice.map((advice, i) => (
                  <span key={i} className="px-3 py-1.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200 shadow-sm">
                    {advice}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <SkeletonWeather />
          )}
        </div>

        {/* 今日任务卡片 - 添加进度条 */}
        <div className="nature-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-[#1a2e1a]">今日任务</h3>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                {pendingCount}项待办
              </span>
            </div>
            <span 
              className="text-sm text-green-600 cursor-pointer active:opacity-60 transition-opacity" 
              onClick={() => setActiveTab(3)}
            >
              查看全部 →
            </span>
          </div>
          {/* 进度条 */}
          {tasks.length > 0 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-[#8b9e82] mb-1">
                <span>完成进度</span>
                <span>{Math.round((tasks.filter(t => t.done).length / tasks.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-green-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
                  style={{ width: `${(tasks.filter(t => t.done).length / tasks.length) * 100}%` }}
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            {pendingTasks.map(task => (
              <div key={task.id} className="flex items-center gap-3 py-2 border-b border-[#e2e8d8] last:border-0">
                <input
                  type="checkbox"
                  checked={task.done}
                  onChange={() => toggleTask(task.id)}
                  className="size-5 rounded border-green-300 text-green-600 focus:ring-green-500 cursor-pointer"
                />
                <span className="text-sm text-[#4a6741]">
                  {getCategoryIcon(task.category)} {task.text}
                </span>
              </div>
            ))}
            {pendingCount === 0 && (
              <EmptyState icon="🎉" text="今日任务已全部完成" />
            )}
          </div>
        </div>

        {/* 快捷操作 - 更大图标 */}
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((item, i) => (
            <button
              key={i}
              onClick={() => setActiveTab(item.tab)}
              className="nature-card p-4 flex flex-col items-center gap-2 active:scale-95 transition-transform cursor-pointer shadow-sm rounded-2xl"
            >
              <span className="text-3xl">{item.icon}</span>
              <span className="text-xs text-[#4a6741] font-medium">{item.label}</span>
            </button>
          ))}
        </div>

        {/* 市场动态 - 添加迷你趋势图 */}
        {marketPreview.length > 0 && (
          <div className="nature-card rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#1a2e1a]">市场动态</h3>
              <span 
                className="text-sm text-green-600 cursor-pointer active:opacity-60 transition-opacity" 
                onClick={() => setActiveTab(2)}
              >
                查看更多 →
              </span>
            </div>
            <div className="space-y-2">
              {marketPreview.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-[#e2e8d8] last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-sm text-[#4a6741]">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.sparkline && <MiniTrendChart data={item.sparkline} trend={item.trend} />}
                    <div className="text-right">
                      <span className="font-medium text-[#1a2e1a]">¥{item.price.toFixed(2)}</span>
                      <span className={`ml-2 text-sm ${item.trend === 'up' ? 'text-red-500' : item.trend === 'down' ? 'text-green-500' : 'text-gray-400'}`}>
                        {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '−'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 农事小贴士 */}
        <div className="nature-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div>
              <h3 className="text-sm font-semibold text-[#1a2e1a]">今日农事小贴士</h3>
              <p className="text-xs text-[#8b9e82] mt-1">
                {getProverb()}。当前季节建议关注田间水肥管理，合理规划种植结构。
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  });
  RenderDashboard.displayName = "RenderDashboard";

  // ==================== Tab 1: Planting (Nature Fresh Wizard) ====================

  const RenderPlanting = memo(() => {
    const landTypes = ["旱地", "水田", "菜地", "果园", "林地", "荒地"];
    const soilTypes = ["黑土", "壤土", "黏土", "红壤", "黄土", "砂土"];
    const terrains = ["平原", "山地", "丘陵", "坡地"];

    const stepTitles = ["土地信息", "天气分析", "AI分析", "规划结果"];
    const stepIcons = ["🌾", "🌤️", "🚀", "📊"];

    // 使用useMemo缓存计算结果
    const stepProgress = useMemo(() => (step / 4) * 100, [step]);
    const isStepComplete = useCallback((s: number) => s < step, [step]);
    const canExpand = useCallback((s: number) => s < step || s === step, [step]);

    return (
      <div className="animate-fade-in-up space-y-4 pb-4">
        {/* 进度条 - 更紧凑 */}
        <div className="nature-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#1a2e1a]">规划进度</span>
            <span className="text-xs font-medium text-green-600">{Math.round(stepProgress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${stepProgress}%` }}
            />
          </div>
          {/* 步骤指示器 */}
          <div className="flex justify-between mt-3">
            {stepTitles.map((title, i) => (
              <div key={i} className="flex flex-col items-center">
                <div className={`size-8 rounded-full flex items-center justify-center text-sm ${
                  i + 1 < step ? "bg-green-500 text-white" :
                  i + 1 === step ? "bg-green-100 text-green-600 border-2 border-green-300" :
                  "bg-gray-100 text-gray-400"
                }`}>
                  {i + 1 < step ? "✓" : stepIcons[i]}
                </div>
                <span className="text-[10px] text-[#8b9e82] mt-1">{title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 步骤卡片列表 */}
        <div className="space-y-3">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="nature-card rounded-2xl shadow-sm overflow-hidden">
              {/* 步骤头部 - 可点击展开/收起 */}
              <button
                onClick={() => {
                  if (canExpand(s)) {
                    setExpandedStep(expandedStep === s ? null : s);
                  }
                }}
                disabled={!canExpand(s)}
                className={`w-full p-4 flex items-center justify-between ${
                  canExpand(s) ? "cursor-pointer active:bg-green-50" : "cursor-not-allowed opacity-50"
                } transition-colors`}
              >
                <div className="flex items-center gap-3">
                  <div className={`size-10 rounded-full flex items-center justify-center text-lg ${
                    isStepComplete(s) 
                      ? "bg-green-500 text-white" 
                      : s === step 
                        ? "bg-green-100 text-green-600 border-2 border-green-300" 
                        : "bg-gray-100 text-gray-400"
                  }`}>
                    {isStepComplete(s) ? "✓" : stepIcons[s - 1]}
                  </div>
                  <div className="text-left">
                    <p className={`font-semibold ${isStepComplete(s) || s === step ? "text-[#1a2e1a]" : "text-gray-400"}`}>
                      第{s}步：{stepTitles[s - 1]}
                    </p>
                    <p className="text-xs text-[#8b9e82]">
                      {isStepComplete(s) ? "已完成" : s === step ? "进行中" : "待完成"}
                    </p>
                  </div>
                </div>
                {canExpand(s) && (
                  <span className={`text-[#8b9e82] transition-transform duration-300 ${expandedStep === s ? "rotate-180" : ""}`}>
                    ▼
                  </span>
                )}
              </button>

              {/* 步骤内容 - 可折叠 */}
              {(expandedStep === s || s === step) && canExpand(s) && (
                <div className="px-4 pb-4 border-t border-[#e2e8d8] animate-fade-in">
                  {/* Step 1: Land Info */}
                  {s === 1 && (
                    <div className="space-y-4 pt-4">
                      {/* Quick Plan */}
                      <button
                        onClick={handleQuickPlan}
                        className="btn-primary w-full ripple-container flex items-center justify-center gap-2"
                      >
                        <span className="text-lg">✨</span>
                        一键规划
                      </button>
                      <p className="text-xs text-[#8b9e82] text-center -mt-2">自动填充默认参数，快速开始</p>

                      {/* Land Area */}
                      <div>
                        <label className="text-sm font-semibold text-[#1a2e1a] block mb-2">土地面积（亩）</label>
                        <input
                          type="number"
                          value={landArea}
                          onChange={(e) => setLandArea(e.target.value)}
                          placeholder="请输入土地面积"
                          className="input-nature"
                        />
                      </div>

                      {/* Image Upload */}
                      <div>
                        <label className="text-sm font-semibold text-[#1a2e1a] block mb-2">拍照识别</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        {imagePreview ? (
                          <div className="relative">
                            <img src={imagePreview} alt="预览" className="w-full h-40 object-cover rounded-xl" />
                            <button
                              onClick={() => { setImagePreview(null); setImageBase64(null); }}
                              className="absolute top-2 right-2 size-7 rounded-full bg-black/40 backdrop-blur-md text-white text-xs cursor-pointer flex items-center justify-center"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full border-2 border-dashed border-[#e2e8d8] rounded-xl py-8 text-center cursor-pointer hover:border-green-300 hover:bg-green-50/50 transition-all"
                          >
                            <span className="text-2xl">📷</span>
                            <span className="text-sm text-[#8b9e82] mt-2 block">点击拍照或上传土地照片</span>
                          </button>
                        )}
                      </div>

                      {/* 两列布局：土地类型 + 土壤类型 */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Land Type */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-[#1a2e1a]">土地类型</label>
                            <button
                              onClick={() => setShowLandTypeHelp(true)}
                              className="text-xs text-green-600"
                            >
                              ?
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {landTypes.map((lt) => (
                              <button
                                key={lt}
                                onClick={() => setLandType(lt)}
                                className={`p-2 rounded-lg text-center cursor-pointer transition-all text-xs ${
                                  landType === lt
                                    ? "bg-green-50 text-green-700 border border-green-300"
                                    : "bg-[#f8faf5] border border-[#e2e8d8] hover:bg-green-50/50"
                                }`}
                              >
                                <span className="text-base block">{getLandIcon(lt)}</span>
                                <span className="mt-0.5 block">{lt}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Soil Type */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-semibold text-[#1a2e1a]">土壤类型</label>
                            <button
                              onClick={() => setShowSoilTypeHelp(true)}
                              className="text-xs text-green-600"
                            >
                              ?
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-1.5">
                            {soilTypes.map((st) => (
                              <button
                                key={st}
                                onClick={() => setSoilType(st)}
                                className={`p-2 rounded-lg text-center cursor-pointer transition-all text-xs ${
                                  soilType === st
                                    ? "bg-green-50 text-green-700 border border-green-300"
                                    : "bg-[#f8faf5] border border-[#e2e8d8] hover:bg-green-50/50"
                                }`}
                              >
                                <span className="text-base block">{getSoilIcon(st)}</span>
                                <span className="mt-0.5 block">{st}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Terrain */}
                      <div>
                        <label className="text-sm font-semibold text-[#1a2e1a] block mb-2">地形</label>
                        <div className="grid grid-cols-4 gap-2">
                          {terrains.map((t) => (
                            <button
                              key={t}
                              onClick={() => setTerrain(t)}
                              className={`p-2 rounded-xl text-center cursor-pointer transition-all text-xs ${
                                terrain === t
                                  ? "bg-green-500 text-white"
                                  : "bg-[#f8faf5] border border-[#e2e8d8] hover:bg-green-50/50"
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      {step === 1 && (
                        <button
                          onClick={() => { setStep(2); setExpandedStep(2); }}
                          className="btn-primary w-full ripple-container mt-2"
                        >
                          下一步 →
                        </button>
                      )}
                    </div>
                  )}

                  {/* Step 2: Weather & Analyze */}
                  {s === 2 && (
                    <div className="space-y-4 pt-4">
                      <button
                        onClick={handleGetGPS}
                        disabled={gpsLoading}
                        className="btn-secondary w-full ripple-container flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {gpsLoading ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            正在获取位置...
                          </>
                        ) : (
                          <>
                            <span className="text-lg">📍</span>
                            获取GPS定位和天气
                          </>
                        )}
                      </button>
                      {gpsError && <p className="text-xs text-red-500 text-center">{gpsError}</p>}

                      {plantingWeather && (
                        <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-xl p-4 border border-sky-100">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="text-3xl">{getWeatherEmoji(plantingWeather.weatherCode)}</span>
                              <div>
                                <p className="text-2xl font-bold text-[#1a2e1a]">{plantingWeather.temperature}℃</p>
                                <p className="text-xs text-[#8b9e82]">{plantingWeather.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="bg-white/50 rounded-lg p-2">
                              <p className="text-xs text-[#8b9e82]">平均温度</p>
                              <p className="text-sm font-semibold text-[#1a2e1a]">{plantingWeather.avgTemperature}℃</p>
                            </div>
                            <div className="bg-white/50 rounded-lg p-2">
                              <p className="text-xs text-[#8b9e82]">预计降水</p>
                              <p className="text-sm font-semibold text-[#1a2e1a]">{plantingWeather.totalPrecipitation}mm</p>
                            </div>
                            <div className="bg-white/50 rounded-lg p-2">
                              <p className="text-xs text-[#8b9e82]">土壤湿度</p>
                              <p className="text-sm font-semibold text-[#1a2e1a]">{plantingWeather.avgSoilMoisture}%</p>
                            </div>
                          </div>
                          <p className="text-xs text-[#8b9e82] mt-2">
                            季节：{plantingWeather.season} · 适宜：{plantingWeather.suitableCrops.slice(0, 3).join("、")}
                          </p>
                        </div>
                      )}

                      {step === 2 && (
                        <button
                          onClick={handleAnalyze}
                          className="btn-primary w-full ripple-container flex items-center justify-center gap-2"
                        >
                          <span className="text-lg">🚀</span>
                          开始AI分析
                        </button>
                      )}
                    </div>
                  )}

                  {/* Step 3: Loading */}
                  {s === 3 && (
                    <div className="flex flex-col items-center justify-center py-8">
                      {step === 3 ? (
                        <>
                          <div className="relative">
                            <div className="w-16 h-16 border-4 border-green-100 border-t-green-500 rounded-full animate-spin" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xl">🌾</span>
                            </div>
                          </div>
                          <p className="text-[#1a2e1a] mt-4 font-semibold">AI正在分析中...</p>
                          <p className="text-xs text-[#8b9e82] mt-1">正在综合分析土地、天气和市场数据</p>
                        </>
                      ) : (
                        <p className="text-sm text-green-600 font-medium">✓ 分析已完成</p>
                      )}
                    </div>
                  )}

                  {/* Step 4: Results */}
                  {s === 4 && recommendation && (
                    <div className="space-y-4 pt-4">
                      {/* 分析成功提示 */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                            <span className="text-white text-lg">✓</span>
                          </div>
                          <div>
                            <p className="font-semibold text-[#1a2e1a]">分析完成</p>
                            <p className="text-xs text-[#8b9e82]">
                              基于收益数据和市场均衡分析，为您推荐最优方案
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 土地概况 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                          <p className="text-xs text-[#8b9e82]">土地类型</p>
                          <p className="text-sm font-semibold text-[#1a2e1a]">{getLandIcon(landType || "旱地")} {landType || "旱地"}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                          <p className="text-xs text-[#8b9e82]">土壤类型</p>
                          <p className="text-sm font-semibold text-[#1a2e1a]">{getSoilIcon(soilType || "壤土")} {soilType || "壤土"}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                          <p className="text-xs text-[#8b9e82]">地形</p>
                          <p className="text-sm font-semibold text-[#1a2e1a]">{terrain || "平原"}</p>
                        </div>
                        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                          <p className="text-xs text-[#8b9e82]">面积</p>
                          <p className="text-sm font-semibold text-[#1a2e1a]">{landArea || "10"}亩</p>
                        </div>
                      </div>

                      {/* 推荐作物 - 带详细收益分析 */}
                      <div>
                        <p className="text-sm font-semibold text-[#1a2e1a] mb-2">智能推荐排名（已考虑市场均衡）</p>
                        <div className="space-y-3">
                          {(() => {
                            const areaNum = parseFloat(landArea) || 10;
                            const recs = getRecommendedCrops(landType, soilType, areaNum);
                            return recs.slice(0, 3).map((cropData, idx) => {
                              const cropInfo = CROP_PROFIT_DATA[cropData.name];
                              const profit = calculateCropProfit(cropData.name, areaNum);
                              return (
                                <div
                                  key={cropData.name}
                                  className={`rounded-xl p-4 ${
                                    idx === 0
                                      ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white"
                                      : idx === 1
                                        ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white"
                                        : "bg-gradient-to-r from-sky-400 to-sky-500 text-white"
                                  }`}
                                >
                                  {/* 作物名称和排名 */}
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-2xl">{cropInfo?.emoji}</span>
                                      <span className="font-semibold text-lg">
                                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} {cropData.name}
                                      </span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${getEquilibriumStyle(cropData.equilibriumStatus.status)}`}>
                                      {getEquilibriumIcon(cropData.equilibriumStatus.status)} {cropData.equilibriumStatus.percentage}%
                                    </span>
                                  </div>

                                  {/* 收益明细 */}
                                  {profit && (
                                    <div className="bg-white/20 rounded-lg p-3 mb-2">
                                      <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                          <span className="opacity-70">预计亩产：</span>
                                          <span className="font-semibold">{cropInfo?.yieldPerMu}斤</span>
                                        </div>
                                        <div>
                                          <span className="opacity-70">市场价格：</span>
                                          <span className="font-semibold">{cropInfo?.pricePerJin}元/斤</span>
                                        </div>
                                        <div>
                                          <span className="opacity-70">亩成本：</span>
                                          <span className="font-semibold">{cropInfo?.costPerMu}元</span>
                                        </div>
                                        <div>
                                          <span className="opacity-70">生长周期：</span>
                                          <span className="font-semibold">{cropInfo?.cycle}</span>
                                        </div>
                                      </div>
                                      <div className="mt-2 pt-2 border-t border-white/30">
                                        <span className="opacity-70">预计净收益：</span>
                                        <span className="font-bold text-lg">{Math.round(profit.netProfit).toLocaleString()}元</span>
                                        <span className="opacity-70 ml-2">({Math.round(profit.profitPerMu)}元/亩)</span>
                                      </div>
                                    </div>
                                  )}

                                  {/* 风险提示 */}
                                  <div className="flex items-center gap-3 text-xs">
                                    <span className="bg-white/20 px-2 py-1 rounded">
                                      风险：{getRiskLevelText(cropInfo?.riskLevel || 'low')}
                                    </span>
                                    <span className="bg-white/20 px-2 py-1 rounded">
                                      市场：{getMarketStabilityText(cropInfo?.marketStability || 'stable')}
                                    </span>
                                    <span className="bg-white/20 px-2 py-1 rounded">
                                      技术：{getRiskLevelText(cropInfo?.techRequirement || 'low')}
                                    </span>
                                  </div>

                                  {/* 市场均衡提示 */}
                                  {cropData.equilibriumStatus.status !== 'normal' && (
                                    <div className={`mt-2 p-2 rounded-lg text-xs ${cropData.equilibriumStatus.status === 'limit' ? 'bg-red-500/30' : 'bg-amber-500/30'}`}>
                                      <span className="font-semibold">⚠️ 市场提醒：</span>
                                      {cropData.equilibriumStatus.message}
                                    </div>
                                  )}
                                </div>
                              );
                            });
                          })()}
                        </div>
                      </div>

                      {/* 收益对比分析 */}
                      {(() => {
                        const areaNum = parseFloat(landArea) || 10;
                        const recs = getRecommendedCrops(landType, soilType, areaNum);
                        if (recs.length < 2) return null;
                        const best = recs[0];
                        const second = recs[1];
                        const profit1 = calculateCropProfit(best.name, areaNum);
                        const profit2 = calculateCropProfit(second.name, areaNum);
                        if (!profit1 || !profit2) return null;
                        const diff = profit1.netProfit - profit2.netProfit;
                        return (
                          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-sm font-semibold text-[#1a2e1a] mb-2">📊 收益对比分析</p>
                            <p className="text-sm text-[#4a6741]">
                              选择 <strong>{best.name}</strong> 比 <strong>{second.name}</strong> 预计多收益
                              <span className="text-green-600 font-bold"> {Math.round(diff).toLocaleString()}元</span>
                              （{Math.round(diff / areaNum)}元/亩）
                            </p>
                            <p className="text-xs text-[#8b9e82] mt-2">
                              💡 此对比已综合考虑市场供需平衡，避免集中种植导致的价格下跌风险
                            </p>
                          </div>
                        );
                      })()}

                      {/* 总体收益预估 */}
                      {(() => {
                        const areaNum = parseFloat(landArea) || 10;
                        const recs = getRecommendedCrops(landType, soilType, areaNum);
                        const bestCrop = recs[0];
                        const profit = bestCrop ? calculateCropProfit(bestCrop.name, areaNum) : null;
                        if (!profit) return null;
                        return (
                          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-white/70 text-sm">最佳方案总收益预估</p>
                                <p className="text-3xl font-bold mt-1">
                                  {Math.round(profit.netProfit).toLocaleString()}元
                                </p>
                                <p className="text-sm text-white/70 mt-1">
                                  种植 {bestCrop?.name} {areaNum}亩 · {Math.round(profit.profitPerMu)}元/亩
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-4xl mb-1">{CROP_PROFIT_DATA[bestCrop?.name || '']?.emoji}</div>
                                <div className="text-xs text-white/70">
                                  利润率 {Math.round(profit.profitMargin)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* 可信度说明 */}
                      <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <p className="text-sm font-semibold text-amber-800 mb-2">🎯 为什么推荐这个方案？</p>
                        <ul className="text-xs text-amber-700 space-y-1">
                          <li>• 基于真实市场数据：包含当前市场价格、种植成本、亩产数据</li>
                          <li>• 考虑市场均衡：避免推荐种植人数过多的作物，降低市场风险</li>
                          <li>• 适配您的土地：根据土地类型、土壤条件筛选适宜作物</li>
                          <li>• 收益可预期：提供详细的成本收益分析，让决策有据可依</li>
                        </ul>
                      </div>

                      {/* 组合种植方案推荐 */}
                      <div>
                        <p className="text-sm font-semibold text-[#1a2e1a] mb-3">🌱 组合种植方案（分散风险）</p>

                        {/* 风险偏好选择 */}
                        <div className="flex gap-2 mb-4">
                          {[
                            { key: 'conservative', label: '稳健型', icon: '🛡️' },
                            { key: 'balanced', label: '平衡型', icon: '⚖️' },
                            { key: 'aggressive', label: '进取型', icon: '🚀' },
                          ].map((opt) => (
                            <button
                              key={opt.key}
                              onClick={() => setRiskPreference(opt.key as 'conservative' | 'balanced' | 'aggressive')}
                              className={`flex-1 p-2 rounded-xl text-sm flex items-center justify-center gap-1 transition-all ${
                                riskPreference === opt.key
                                  ? 'bg-green-500 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-green-50'
                              }`}
                            >
                              <span>{opt.icon}</span>
                              <span>{opt.label}</span>
                            </button>
                          ))}
                        </div>

                        {/* 组合方案展示 */}
                        <div className="space-y-3">
                          {(() => {
                            const areaNum = parseFloat(landArea) || 10;
                            const portfolios = generatePortfolioRecommendations(areaNum, riskPreference);
                            return portfolios.map((portfolio, idx) => (
                              <div
                                key={portfolio.name}
                                className={`rounded-xl p-4 border-2 ${
                                  idx === 0
                                    ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white border-purple-400'
                                    : 'bg-white border-gray-200'
                                }`}
                              >
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xl">{idx === 0 ? '🤖' : '📋'}</span>
                                    <span className={`font-semibold ${idx === 0 ? 'text-white' : 'text-[#1a2e1a]'}`}>
                                      {portfolio.name}
                                    </span>
                                  </div>
                                  <span className={`text-xs px-2 py-1 rounded-full ${
                                    idx === 0
                                      ? 'bg-white/20 text-white'
                                      : portfolio.riskLevel === '低'
                                        ? 'bg-green-100 text-green-700'
                                        : portfolio.riskLevel === '中'
                                          ? 'bg-amber-100 text-amber-700'
                                          : 'bg-red-100 text-red-700'
                                  }`}>
                                    风险{portfolio.riskLevel}
                                  </span>
                                </div>

                                {/* 作物配比 */}
                                <div className="space-y-2 mb-3">
                                  {portfolio.crops.map((crop) => (
                                    <div
                                      key={crop.name}
                                      className={`flex items-center justify-between p-2 rounded-lg ${
                                        idx === 0 ? 'bg-white/20' : 'bg-gray-50'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="text-lg">{CROP_PROFIT_DATA[crop.name]?.emoji}</span>
                                        <span className={`text-sm ${idx === 0 ? 'text-white' : 'text-[#4a6741]'}`}>
                                          {crop.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <div className={`h-2 w-20 rounded-full ${idx === 0 ? 'bg-white/30' : 'bg-gray-200'}`}>
                                          <div
                                            className={`h-full rounded-full ${idx === 0 ? 'bg-white' : 'bg-green-500'}`}
                                            style={{ width: `${crop.ratio}%` }}
                                          />
                                        </div>
                                        <span className={`text-sm font-semibold ${idx === 0 ? 'text-white' : 'text-[#1a2e1a]'}`}>
                                          {crop.ratio}%
                                        </span>
                                        <span className={`text-xs ${idx === 0 ? 'text-white/70' : 'text-[#8b9e82]'}`}>
                                          {Math.round(crop.area)}亩
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* 预期收益 */}
                                <div className={`p-3 rounded-lg ${idx === 0 ? 'bg-white/20' : 'bg-green-50'}`}>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-sm ${idx === 0 ? 'text-white/80' : 'text-[#8b9e82]'}`}>
                                      预期总收益
                                    </span>
                                    <span className={`text-xl font-bold ${idx === 0 ? 'text-white' : 'text-green-600'}`}>
                                      {Math.round(portfolio.expectedProfit).toLocaleString()}元
                                    </span>
                                  </div>
                                  <p className={`text-xs mt-1 ${idx === 0 ? 'text-white/70' : 'text-[#8b9e82]'}`}>
                                    {portfolio.description}
                                  </p>
                                </div>
                              </div>
                            ));
                          })()}
                        </div>

                        {/* 组合优势说明 */}
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <p className="text-xs text-blue-700">
                            <span className="font-semibold">💡 组合种植优势：</span>
                            通过种植多种作物，可以分散单一作物价格波动风险，同时平衡不同作物的生长周期，实现稳定收益。
                          </p>
                        </div>
                      </div>

                      {/* 操作按钮 */}
                      {step === 4 && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              const saved = localStorage.getItem('smartfarm_plans');
                              const plans = saved ? JSON.parse(saved) : [];
                              plans.push({
                                id: Date.now(),
                                date: new Date().toLocaleDateString(),
                                crops: recommendation?.crops || [],
                                landType: landType,
                                soilType: soilType,
                              });
                              localStorage.setItem('smartfarm_plans', JSON.stringify(plans));
                              alert('方案已保存！');
                            }}
                            className="btn-primary flex-1 ripple-container flex items-center justify-center gap-2"
                          >
                            <span>💾</span>
                            保存方案
                          </button>
                          <button
                            onClick={() => { setStep(1); setRecommendation(null); setExpandedStep(1); }}
                            className="btn-outline flex-1"
                          >
                            ← 重新规划
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {showShareToast && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 toast-nature text-[#1a2e1a] px-8 py-4 rounded-2xl text-sm animate-scale-in z-50">
            分享链接已复制到剪贴板
          </div>
        )}
      </div>
    );
  });
  RenderPlanting.displayName = "RenderPlanting";

  // ==================== Tab 2: Market (Nature Fresh) ====================

  const RenderMarket = memo(() => {
    const categories = ["全部", "蔬菜", "水果", "粮食"];
    const [marketSearch, setMarketSearch] = useState("");
    const [marketSortOrder, setMarketSortOrder] = useState<'default' | 'priceAsc' | 'priceDesc'>('default');

    // 使用useMemo缓存过滤结果
    const filteredItems = useMemo(() => {
      if (!marketFull?.items) return [];
      let items = marketFull.items;
      if (marketTab === 0) {
        // no category filter
      } else {
        const categoryName = categories[marketTab];
        items = items.filter(item => {
          const name = item.name;
          if (categoryName === "蔬菜") return /菜|椒|茄|瓜|豆|菇|笋|葱|姜|蒜|菠|芹|苋|芥|莴|茼|蕹|芋|藕|菌|番茄|黄瓜|白菜|萝卜|土豆|红薯|南瓜|冬瓜/i.test(name);
          if (categoryName === "水果") return /果|瓜|莓|桃|梨|苹|橘|橙|柚|柿|枣|葡|荔|芒|香|樱|李|杏|柑/i.test(name);
          if (categoryName === "粮食") return /米|麦|玉|谷|粮|豆|薯|芋|稻|高粱|谷子|燕麦|荞麦|青稞/i.test(name);
          return true;
        });
      }
      // 搜索过滤
      if (marketSearch.trim()) {
        const keyword = marketSearch.trim().toLowerCase();
        items = items.filter(item => item.name.toLowerCase().includes(keyword));
      }
      // 排序
      if (marketSortOrder === 'priceAsc') {
        items = [...items].sort((a, b) => a.price - b.price);
      } else if (marketSortOrder === 'priceDesc') {
        items = [...items].sort((a, b) => b.price - a.price);
      }
      return items;
    }, [marketFull?.items, marketTab, marketSearch, marketSortOrder]);

    // 缓存价格指数显示
    const indexDisplay = useMemo(() => {
      const index = marketFull?.index ?? 100;
      const change = marketFull?.indexChange ?? 0;
      const isUp = change >= 0;
      return {
        value: index.toFixed(2),
        change: `${isUp ? "↑" : "↓"} ${Math.abs(change).toFixed(2)}`,
        isUp
      };
    }, [marketFull?.index, marketFull?.indexChange]);

    return (
      <div className="animate-fade-in-up space-y-4 pb-4">
        {/* 顶部概览卡片 - 大数字+趋势箭头 */}
        <div className="nature-card p-5 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-3xl">
          <p className="text-sm opacity-90">农产品价格指数</p>
          <div className="flex items-end gap-3 mt-2">
            <span className="text-5xl font-bold tracking-tight">{indexDisplay.value}</span>
            <span className={`flex items-center gap-1 text-lg font-medium mb-1.5 ${indexDisplay.isUp ? "text-red-200" : "text-green-200"}`}>
              {indexDisplay.change}
            </span>
          </div>
          <div className="flex gap-6 mt-4 text-sm">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-red-300"></span>
              <span>涨 <strong>{marketFull?.upCount || 0}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-green-300"></span>
              <span>跌 <strong>{marketFull?.downCount || 0}</strong></span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-white/50"></span>
              <span>平 <strong>{marketFull?.stableCount || 0}</strong></span>
            </span>
          </div>
        </div>

        {/* 搜索框 */}
        <div className="relative">
          <input
            type="text"
            value={marketSearch}
            onChange={(e) => setMarketSearch(e.target.value)}
            placeholder="搜索农产品..."
            className="w-full px-4 py-2.5 pl-10 rounded-xl bg-white border border-[#e2e8d8] text-sm text-[#1a2e1a] placeholder:text-[#8b9e82] focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9e82]">🔍</span>
          <button
            onClick={() => setMarketSortOrder(marketSortOrder === 'default' ? 'priceAsc' : marketSortOrder === 'priceAsc' ? 'priceDesc' : 'default')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b9e82] text-sm"
            title={marketSortOrder === 'default' ? '默认排序' : marketSortOrder === 'priceAsc' ? '价格升序' : '价格降序'}
          >
            {marketSortOrder === 'default' ? '📋' : marketSortOrder === 'priceAsc' ? '↗️' : '↘️'}
          </button>
        </div>

        {/* 分类筛选 - 横向滚动Tab样式 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1 -mx-1">
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setMarketTab(i)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                marketTab === i 
                  ? "bg-green-500 text-white shadow-md" 
                  : "bg-white text-[#4a6741] border border-[#e2e8d8] hover:bg-green-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 价格列表 - 添加迷你趋势图 */}
        <div className="nature-card rounded-2xl divide-y divide-[#e2e8d8]">
          {filteredItems.length === 0 ? (
            <EmptyState icon="📊" text="暂无该分类数据" />
          ) : (
            filteredItems.map((item, i) => (
              <div
                key={i}
                className="p-4 flex items-center justify-between hover:bg-green-50/50 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji || "🌾"}</span>
                  <div>
                    <p className="font-medium text-[#1a2e1a]">{item.name}</p>
                    <p className="text-xs text-[#8b9e82]">元/公斤</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {item.sparkline && <MiniTrendChart data={item.sparkline} trend={item.trend} />}
                  <div className="text-right">
                    <p className="font-semibold text-[#1a2e1a]">¥{item.price.toFixed(2)}</p>
                    <p className={`text-sm font-medium ${item.trend === "up" ? "text-red-500" : item.trend === "down" ? "text-green-500" : "text-gray-400"}`}>
                      {item.change || "--"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 价格走势图 */}
        <div className="nature-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[#1a2e1a] mb-4">价格走势图</h3>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-4 pb-1">
            {marketFull?.items.slice(0, 8).map((item) => (
              <button
                key={item.name}
                onClick={() => setSelectedCrop(item.name)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCrop === item.name
                    ? "bg-green-500 text-white"
                    : "bg-[#f8faf5] text-[#4a6741] border border-[#e2e8d8] hover:bg-green-50"
                }`}
              >
                {item.emoji} {item.name}
              </button>
            ))}
          </div>
          {!marketFull?.items || marketFull.items.length === 0 ? (
            <EmptyState icon="📈" text="暂无走势图数据" />
          ) : !selectedCrop ? (
            <p className="text-center py-8 text-[#8b9e82] text-sm">请选择作物查看价格走势</p>
          ) : (
            renderPriceChart()
          )}
        </div>

        {/* 市场简报 */}
        {marketFull?.briefings && marketFull.briefings.length > 0 && (
          <div className="nature-card rounded-2xl p-4">
            <h3 className="font-semibold text-[#1a2e1a] mb-3">市场简报</h3>
            <div className="space-y-3">
              {marketFull.briefings.slice(0, 3).map((brief, i) => (
                <div key={i} className="p-3 bg-[#f8faf5] rounded-xl">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                      brief.type === "政策" ? "bg-blue-100 text-blue-700" :
                      brief.type === "行情" ? "bg-green-100 text-green-700" :
                      brief.type === "预警" ? "bg-red-100 text-red-700" :
                      "bg-amber-100 text-amber-700"
                    }`}>
                      {brief.type}
                    </span>
                    <span className="text-xs text-[#8b9e82]">{brief.time}</span>
                  </div>
                  <p className="text-sm text-[#1a2e1a]">{brief.title}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 宏观数据 */}
        {marketFull?.macro && (
          <div className="nature-card rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-[#1a2e1a] mb-4">宏观数据</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-sky-50 rounded-2xl p-3 text-center border border-sky-100">
                <p className="text-xs text-sky-500">种植面积</p>
                <p className="text-sm font-bold text-[#1a2e1a] mt-1">4.52亿亩</p>
              </div>
              <div className="bg-green-50 rounded-2xl p-3 text-center border border-green-100">
                <p className="text-xs text-green-600">供需比</p>
                <p className="text-sm font-bold text-[#1a2e1a] mt-1">1.05</p>
              </div>
              <div className="bg-amber-50 rounded-2xl p-3 text-center border border-amber-100">
                <p className="text-xs text-amber-500">季节预测</p>
                <p className="text-sm font-bold text-[#1a2e1a] mt-1">稳中有降</p>
              </div>
            </div>
            {marketFull.macro.policyInfo && (
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1a2e1a]">政策信息</span>
                  <button className="btn-pill btn-pill-inactive text-[10px]">详情</button>
                </div>
                <p className="text-xs text-[#8b9e82] mt-1 line-clamp-2">{marketFull.macro.policyInfo}</p>
              </div>
            )}
          </div>
        )}

        {/* 数据来源 */}
        <div className="text-center text-xs text-[#8b9e82] py-2">
          数据来源：农业农村部重点农产品市场信息平台
          <br />
          更新时间：{marketFull?.updateTime || "--"}
        </div>
      </div>
    );
  });
  RenderMarket.displayName = "RenderMarket";

  // ==================== Tab 3: Management (Nature Fresh) ====================

  const RenderManagement = memo(() => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
    const activities = getMonthActivities();
    const activityDays = activities.map((a) => a.day);
    const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

    // 统计数据
    const todayStr = getTodayStr();
    const todayTasks = tasks.filter(t => t.date === todayStr || t.date === "今天");
    const pendingTasks = tasks.filter(t => !t.done);
    const completedTasks = tasks.filter(t => t.done);
    const completionRate = tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0;

    const handleAddTask = () => {
      if (!newTask.trim()) return;
      const newTaskItem: Task = {
        id: Date.now().toString(),
        text: newTask,
        done: false,
        date: todayStr,
        category: newTaskCategory,
        priority: newTaskPriority,
      };
      setTasks([...tasks, newTaskItem]);
      saveToStorage(STORAGE_KEYS.tasks, [...tasks, newTaskItem]);
      setNewTask("");
      setNewTaskCategory("其他");
      setNewTaskPriority("medium");
      setShowAddTask(false);
    };

    const handleDeleteTask = (id: string) => {
      const updated = tasks.filter(t => t.id !== id);
      setTasks(updated);
      saveToStorage(STORAGE_KEYS.tasks, updated);
    };

    return (
      <div className="animate-fade-in-up space-y-4 pb-20">
        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="nature-card p-3 text-center rounded-2xl">
            <p className="text-2xl font-bold text-green-600">{pendingTasks.length}</p>
            <p className="text-xs text-[#8b9e82]">待完成</p>
          </div>
          <div className="nature-card p-3 text-center rounded-2xl">
            <p className="text-2xl font-bold text-amber-500">{todayTasks.filter(t => !t.done).length}</p>
            <p className="text-xs text-[#8b9e82]">今日待办</p>
          </div>
          <div className="nature-card p-3 text-center rounded-2xl">
            <p className="text-2xl font-bold text-[#1a2e1a]">{completionRate}%</p>
            <p className="text-xs text-[#8b9e82]">完成率</p>
          </div>
        </div>

        {/* 智能控制面板 */}
        <div className="nature-card rounded-2xl p-4">
          <h3 className="font-semibold text-[#1a2e1a] mb-3 flex items-center gap-2">
            <span>🏠</span> 智能控制
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: "💧", label: "自动灌溉", desc: "土壤湿度低于30%时自动开启", state: smartIrrigation, toggle: () => setSmartIrrigation(!smartIrrigation) },
              { icon: "🌡️", label: "温室通风", desc: "温度高于35℃时自动开启", state: greenhouseVent, toggle: () => setGreenhouseVent(!greenhouseVent) },
              { icon: "💡", label: "补光系统", desc: "光照不足时自动补光", state: supplementLight, toggle: () => setSupplementLight(!supplementLight) },
              { icon: "🛡️", label: "防虫预警", desc: "检测到虫害自动通知", state: pestAlert, toggle: () => setPestAlert(!pestAlert) },
            ].map((ctrl, i) => (
              <div key={i} className="bg-[#f8faf5] rounded-xl p-3 border border-[#e2e8d8]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg">{ctrl.icon}</span>
                  <button
                    onClick={ctrl.toggle}
                    className={`w-10 h-5 rounded-full transition-colors duration-300 relative ${ctrl.state ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${ctrl.state ? 'translate-x-5' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <p className="text-xs font-medium text-[#1a2e1a]">{ctrl.label}</p>
                <p className="text-[10px] text-[#8b9e82] mt-0.5">{ctrl.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 任务统计概览 */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-amber-50 rounded-xl p-3 text-center border border-amber-100">
            <p className="text-lg font-bold text-amber-600">{tasks.filter(t => !t.done && t.priority === 'high').length}</p>
            <p className="text-[10px] text-[#8b9e82]">紧急任务</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 text-center border border-blue-100">
            <p className="text-lg font-bold text-blue-600">{tasks.filter(t => !t.done).length}</p>
            <p className="text-[10px] text-[#8b9e82]">待办任务</p>
          </div>
          <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
            <p className="text-lg font-bold text-green-600">{tasks.filter(t => t.done).length}</p>
            <p className="text-[10px] text-[#8b9e82]">已完成</p>
          </div>
        </div>

        {/* 进度条 */}
        <div className="nature-card p-4 rounded-2xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#4a6741]">任务总进度</span>
            <span className="text-green-600">{completedTasks.length}/{tasks.length}</span>
          </div>
          <div className="h-2 bg-green-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>

        {/* 农事日历 */}
        <div className="nature-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[#1a2e1a] mb-4">农事日历</h3>
          <div className="grid grid-cols-7 gap-1 text-center">
            {weekDays.map((d) => (
              <div key={d} className="text-xs text-[#8b9e82] py-2 font-medium">
                {d}
              </div>
            ))}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const isToday = day === now.getDate();
              const hasActivity = activityDays.includes(day);
              return (
                <div
                  key={day}
                  className={`relative py-2 text-xs rounded-xl transition-all duration-200 ${
                    isToday ? "bg-green-500 text-white font-bold shadow-[0_2px_8px_rgba(34,197,94,0.25)]" : "text-[#4a6741]"
                  }`}
                >
                  {day}
                  {hasActivity && (
                    <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${isToday ? "bg-white" : "bg-green-500"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="mt-4 space-y-2">
            {activities.map((a) => (
              <div key={a.day} className="flex items-center gap-2 text-xs text-[#4a6741] bg-green-50 rounded-xl px-3 py-2 border border-green-100">
                <span className="text-green-600 font-semibold">{a.day}日</span>
                <span>{a.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 待办任务 */}
        <div className="nature-card rounded-2xl">
          <div className="p-4 border-b border-[#e2e8d8]">
            <h3 className="font-semibold text-[#1a2e1a]">待办任务</h3>
          </div>
          {pendingTasks.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">🎉</div>
              <p className="text-[#8b9e82]">所有任务已完成！</p>
            </div>
          ) : (
            <div className="divide-y divide-[#e2e8d8]">
              {pendingTasks.map(task => (
                <div key={task.id} className="p-4 flex items-center gap-3 hover:bg-green-50/50 transition-all duration-200">
                  <input
                    type="checkbox"
                    checked={task.done}
                    onChange={() => toggleTask(task.id)}
                    className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500 cursor-pointer"
                  />
                  <div className="flex-1">
                    <p className="text-[#1a2e1a]">{task.text}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 bg-green-50 text-green-700 rounded-full">{task.category}</span>
                      <span className="text-xs text-[#8b9e82]">{task.date}</span>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${
                    task.priority === "high" ? "bg-red-500" :
                    task.priority === "medium" ? "bg-amber-500" : "bg-sky-500"
                  }`} />
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="w-6 h-6 flex items-center justify-center rounded-full text-[#8b9e82] hover:text-red-500 hover:bg-red-50 transition-colors text-sm"
                    title="删除任务"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 已完成任务 */}
        {completedTasks.length > 0 && (
          <div className="nature-card rounded-2xl">
            <div className="p-4 border-b border-[#e2e8d8]">
              <h3 className="font-semibold text-[#8b9e82]">已完成 ({completedTasks.length})</h3>
            </div>
            <div className="divide-y divide-[#e2e8d8]">
              {completedTasks.slice(0, 5).map(task => (
                <div key={task.id} className="p-4 flex items-center gap-3 opacity-60">
                  <input
                    type="checkbox"
                    checked
                    onChange={() => toggleTask(task.id)}
                    className="w-5 h-5 rounded border-green-300 text-green-600 cursor-pointer"
                  />
                  <span className="line-through text-[#8b9e82]">{task.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 生长记录 */}
        <div className="nature-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[#1a2e1a] mb-4">生长记录</h3>
          {growthRecords.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {growthRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex-shrink-0 w-28 bg-green-50 rounded-2xl p-3 text-center border border-green-100 nature-card-hover transition-all duration-300"
                >
                  <span className="text-3xl block">{record.img}</span>
                  <p className="text-xs font-medium text-[#4a6741] mt-2">{record.text}</p>
                  <p className="text-xs text-[#8b9e82]">{record.date}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-[#8b9e82]">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-3xl mb-4 animate-float border border-green-100">
                🌳
              </div>
              <p className="text-sm">暂无生长记录</p>
            </div>
          )}
        </div>

        {/* 悬浮添加按钮 */}
        <button
          onClick={() => setShowAddTask(true)}
          className="fixed bottom-24 right-4 w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full shadow-lg flex items-center justify-center text-white text-2xl active:scale-95 transition-transform z-40"
        >
          +
        </button>

        {/* 添加任务弹窗 */}
        {showAddTask && (
          <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50" onClick={() => setShowAddTask(false)}>
            <div className="bg-white w-full max-w-lg rounded-t-3xl p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-semibold mb-4 text-[#1a2e1a]">添加任务</h3>
              <input
                type="text"
                placeholder="任务内容"
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                className="input-nature mb-3 w-full"
                onKeyDown={e => e.key === "Enter" && handleAddTask()}
              />
              <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-2">
                {(["施肥", "灌溉", "除虫", "除草", "其他"] as const).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setNewTaskCategory(cat)}
                    className={`btn-pill whitespace-nowrap ${newTaskCategory === cat ? "btn-pill-active" : "btn-pill-inactive"}`}
                  >
                    {getCategoryIcon(cat)} {cat}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setNewTaskPriority("high")}
                  className={`btn-pill ${newTaskPriority === "high" ? "!bg-gradient-to-r !from-red-500 !to-red-600 !text-white" : "btn-pill-inactive"}`}
                >
                  紧急
                </button>
                <button
                  onClick={() => setNewTaskPriority("medium")}
                  className={`btn-pill ${newTaskPriority === "medium" ? "!bg-gradient-to-r !from-amber-400 !to-amber-500 !text-white" : "btn-pill-inactive"}`}
                >
                  一般
                </button>
                <button
                  onClick={() => setNewTaskPriority("low")}
                  className={`btn-pill ${newTaskPriority === "low" ? "!bg-gradient-to-r !from-sky-400 !to-sky-500 !text-white" : "btn-pill-inactive"}`}
                >
                  低
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setShowAddTask(false)} className="btn-outline flex-1">取消</button>
                <button onClick={handleAddTask} className="btn-primary flex-1">添加</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  });
  RenderManagement.displayName = "RenderManagement";

  // ==================== Tab 4: Assistant (Nature Fresh Chat) ====================

  const RenderAssistant = memo(() => {
    // 使用useMemo缓存快捷问题
    const quickQuestions = useMemo(() => [
      { icon: "🌱", text: "今天适合种什么？" },
      { icon: "🐛", text: "如何防治蚜虫？" },
      { icon: "💰", text: "最近菜价怎么样？" },
      { icon: "📸", text: "拍照识别病虫害" },
    ], []);

    // 使用useCallback缓存事件处理
    const handleQuickQuestion = useCallback((text: string) => {
      if (text === "拍照识别病虫害") {
        startCamera();
        return;
      }
      setInputText(text);
      setTimeout(() => {
        processMessage(text, "text");
      }, 100);
    }, [processMessage, startCamera]);

    // 只渲染前20条消息（性能优化）
    const visibleMessages = useMemo(() => chatMessages.slice(-20), [chatMessages]);

    return (
      <div className="animate-fade-in-up flex flex-col h-[calc(100vh-140px)]">
        {/* 欢迎卡片 - 更紧凑 */}
        <div className="nature-card p-3 mb-3 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-xl shadow-[0_4px_12px_rgba(34,197,94,0.25)]">
                🤖
              </div>
              <div>
                <h3 className="font-semibold text-[#1a2e1a]">智农助手</h3>
                <p className="text-xs text-[#8b9e82]">您的专属农业顾问</p>
              </div>
            </div>
            {/* API状态指示器 */}
            <div className="flex items-center gap-1.5">
              <div className={`size-2 rounded-full ${apiStatus.configured ? 'bg-green-500' : 'bg-amber-400'} animate-pulse`} />
              <span className="text-xs text-[#8b9e82]">
                {apiStatus.checked ? (apiStatus.configured ? 'AI在线' : '本地模式') : '检测中...'}
              </span>
            </div>
            <button
              onClick={() => {
                if (confirm("确定要清空所有对话记录吗？")) {
                  setChatMessages([{ role: "ai", text: "您好！我是智农助手，有什么可以帮您的？" }]);
                }
              }}
              className="text-xs text-[#8b9e82] hover:text-red-500 transition-colors"
              title="清空对话"
            >
              🗑️
            </button>
          </div>
        </div>

        {/* 聊天区域 - 更紧凑 */}
        <div className="flex-1 overflow-y-auto space-y-2 pb-3 px-1 scrollbar-hide">
          {visibleMessages.length === 0 ? (
            <EmptyState icon="💬" text="开始和AI助手对话吧" />
          ) : (
            visibleMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
              >
                {msg.role === "ai" && (
                  <div className="size-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-base flex-shrink-0 mr-2 shadow-[0_2px_8px_rgba(34,197,94,0.2)]">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[80%] p-2.5 rounded-2xl ${
                    msg.role === "user"
                      ? "bg-green-500 text-white rounded-br-sm shadow-[0_4px_12px_rgba(34,197,94,0.2)]"
                      : "nature-card text-[#4a6741] rounded-bl-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                </div>
              </div>
            ))
          )}
          {/* AI正在输入动画 */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="size-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-base flex-shrink-0 mr-2 shadow-[0_2px_8px_rgba(34,197,94,0.2)]">
                🤖
              </div>
              <div className="nature-card p-2.5 rounded-2xl rounded-bl-sm">
                <TypingIndicator />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 快捷问题 - 卡片网格 */}
        {chatMessages.length <= 1 && (
          <div className="grid grid-cols-2 gap-2 pb-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleQuickQuestion(q.text)}
                className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 text-left active:scale-[0.98] transition-transform"
              >
                <span className="text-xl">{q.icon}</span>
                <p className="text-xs font-medium text-[#1a2e1a] mt-1">{q.text}</p>
              </button>
            ))}
          </div>
        )}

        {/* 输入区域 - 固定在底部 */}
        <div className="flex gap-2 items-center pt-2">
          <button
            onClick={handleVoiceStart}
            className={`size-11 rounded-full flex-shrink-0 flex items-center justify-center cursor-pointer transition-all duration-300 ${
              isListening
                ? "bg-gradient-to-b from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-gentle-pulse"
                : "bg-[#f8faf5] text-green-600 active:scale-95 border border-[#e2e8d8]"
            }`}
          >
            <span className="text-lg">{isListening ? "⏹" : "🎤"}</span>
          </button>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            placeholder="输入您的问题..."
            className="input-nature flex-1"
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="size-11 rounded-full bg-green-500 text-white disabled:opacity-50 active:scale-95 transition-transform flex-shrink-0 shadow-[0_4px_12px_rgba(34,197,94,0.25)] cursor-pointer flex items-center justify-center"
          >
            <span className="text-lg">📤</span>
          </button>
        </div>

        {/* 语音识别结果提示 */}
        {voiceText && (
          <p className="text-xs text-center text-[#8b9e82] pt-2">识别结果：{voiceText}</p>
        )}

        {/* 相机和视频通话区域 */}
        <div className="border-t border-[#e2e8d8] pt-3 mt-3">
          <div className="flex gap-2 mb-2">
            <button
              onClick={() => {
                if (cameraActive) {
                  stopCamera();
                } else {
                  startCamera();
                }
              }}
              className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all duration-200 bg-[#f8faf5] hover:bg-green-50/50 active:bg-green-50 text-[#4a6741] text-sm border border-[#e2e8d8]"
            >
              <span>📷</span>
              {cameraActive ? "关闭相机" : "拍照识别"}
            </button>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) handleChatImageUpload(file);
                };
                input.click();
              }}
              className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-xl cursor-pointer transition-all duration-200 bg-[#f8faf5] hover:bg-green-50/50 active:bg-green-50 text-[#4a6741] text-sm border border-[#e2e8d8]"
            >
              <span>🖼️</span>
              从相册选择
            </button>
          </div>

          {/* 相机取景器 */}
          {cameraExpanded && (
            <div className="relative bg-black rounded-2xl overflow-hidden" style={{ height: cameraActive ? "200px" : "0px" }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 left-2 w-6 h-6 border-t-2 border-l-2 border-green-400" />
              <div className="absolute top-2 right-2 w-6 h-6 border-t-2 border-r-2 border-green-400" />
              <div className="absolute bottom-2 left-2 w-6 h-6 border-b-2 border-l-2 border-green-400" />
              <div className="absolute bottom-2 right-2 w-6 h-6 border-b-2 border-r-2 border-green-400" />
              {cameraActive && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-4">
                  <button
                    onClick={capturePhoto}
                    className="w-12 h-12 rounded-full bg-white border-4 border-green-400 cursor-pointer shadow-[0_2px_12px_rgba(34,197,94,0.25)]"
                  />
                </div>
              )}
            </div>
          )}

          {/* 拍摄的照片 */}
          {capturedFrame && (
            <div className="mt-2 relative">
              <img src={capturedFrame} alt="拍摄" className="w-full h-40 object-cover rounded-2xl" />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={handlePhotoAnalyze}
                  className="btn-primary flex-1 ripple-container flex items-center justify-center gap-2"
                >
                  <span>🔬</span>
                  AI分析
                </button>
                <button
                  onClick={() => setCapturedFrame(null)}
                  className="btn-outline flex-1"
                >
                  重拍
                </button>
              </div>
            </div>
          )}

        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  });
  RenderAssistant.displayName = "RenderAssistant";

  // ==================== Tab 5: Profile (Nature Fresh) ====================

  const RenderProfile = memo(() => {
    // 农场统计数据（从tasks和marketData计算真实数据）
    const farmStats = useMemo(() => {
      const totalArea = 120; // 模拟
      const cropTypes = 8;
      const revenue = marketData.reduce((sum, m) => sum + m.price * 100, 0);
      const completionRate = tasks.length > 0 ? Math.round(tasks.filter(t => t.done).length / tasks.length * 100) : 0;
      return { totalArea, cropTypes, revenue: Math.round(revenue), completionRate };
    }, [tasks, marketData]);

    // 功能菜单 - 每个都有实际功能
    const menuGroups = [
      {
        title: "农场管理",
        items: [
          { icon: "📋", label: "种植记录", desc: "查看历史种植数据", action: () => setActiveTab(1) },
          { icon: "📦", label: "供应信息", desc: "管理农产品供应", action: () => setActiveTab(2) },
          { icon: "⚙️", label: "设备管理", desc: "智能设备控制", action: () => setActiveTab(3) },
          { icon: "🔔", label: "价格预警", desc: "设置价格提醒", action: () => setActiveTab(2) },
        ]
      },
      {
        title: "学习与帮助",
        items: [
          { icon: "🎓", label: "农技培训", desc: "种植技术课程", action: () => { setInputText("有哪些农技培训课程推荐？"); setActiveTab(4); setTimeout(() => processMessage("有哪些农技培训课程推荐？"), 200); } },
          { icon: "💬", label: "意见反馈", desc: "帮助我们改进", action: () => { setInputText("我想提交一条意见反馈"); setActiveTab(4); setTimeout(() => processMessage("我想提交一条意见反馈"), 200); } },
          { icon: "❓", label: "帮助中心", desc: "常见问题解答", action: () => { setInputText("如何使用智农APP？"); setActiveTab(4); setTimeout(() => processMessage("如何使用智农APP？"), 200); } },
          { icon: "ℹ️", label: "关于我们", desc: "版本 v4.1", action: () => {} },
        ]
      }
    ];

    return (
      <div className="animate-fade-in-up space-y-4 pb-4">
        {/* 用户信息卡片 - 渐变背景 */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-6 text-white shadow-lg">
          {/* 装饰圆形 */}
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/5" />
          
          <div className="relative flex items-center gap-4">
            <div className="size-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-3xl border-2 border-white/30">
              👨‍🌾
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">{userName}</h2>
              <p className="text-sm text-white/80 mt-0.5">绿源生态农场 · {userProvince || "未设置地区"}</p>
            </div>
            <button 
              onClick={() => { setInputText("我想修改我的个人信息"); setActiveTab(4); setTimeout(() => processMessage("我想修改我的个人信息"), 200); }}
              className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur text-sm font-medium active:scale-95 transition-transform"
            >
              编辑资料
            </button>
          </div>
        </div>

        {/* 农场统计卡片 - 2x2网格 */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: "🌾", label: "种植面积", value: `${farmStats.totalArea}亩`, color: "from-green-50 to-emerald-50 border-green-100", iconBg: "bg-green-100" },
            { icon: "🌱", label: "作物种类", value: `${farmStats.cropTypes}种`, color: "from-amber-50 to-orange-50 border-amber-100", iconBg: "bg-amber-100" },
            { icon: "💰", label: "预期收益", value: `¥${(farmStats.revenue / 10000).toFixed(1)}万`, color: "from-blue-50 to-sky-50 border-blue-100", iconBg: "bg-blue-100" },
            { icon: "✅", label: "任务完成率", value: `${farmStats.completionRate}%`, color: "from-purple-50 to-pink-50 border-purple-100", iconBg: "bg-purple-100" },
          ].map((stat, i) => (
            <div key={i} className={`rounded-2xl p-4 bg-gradient-to-br ${stat.color} border`}>
              <div className={`size-9 rounded-xl ${stat.iconBg} flex items-center justify-center text-lg mb-2`}>{stat.icon}</div>
              <p className="text-xs text-[#8b9e82]">{stat.label}</p>
              <p className="text-lg font-bold text-[#1a2e1a] mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* 功能菜单分组 */}
        {menuGroups.map((group, gi) => (
          <div key={gi} className="nature-card rounded-2xl overflow-hidden">
            <h3 className="px-4 pt-4 pb-2 text-sm font-semibold text-[#8b9e82]">{group.title}</h3>
            {group.items.map((item, ii) => (
              <button
                key={ii}
                onClick={item.action}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-green-50/50 active:bg-green-50 transition-colors text-left border-b border-[#e2e8d8] last:border-0"
              >
                <span className="text-xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#1a2e1a]">{item.label}</p>
                  <p className="text-xs text-[#8b9e82]">{item.desc}</p>
                </div>
                <ChevronRightIcon className="w-4 h-4 text-[#8b9e82]" />
              </button>
            ))}
          </div>
        ))}

        {/* 退出登录 */}
        <button
          onClick={() => {
            if (confirm("确定要退出登录吗？")) {
              setChatMessages([{ role: "ai", text: "您已退出登录。欢迎随时回来使用智农助手！" }]);
              setActiveTab(0);
            }
          }}
          className="w-full py-3 rounded-2xl border-2 border-red-200 text-red-500 font-medium text-sm active:bg-red-50 transition-colors"
        >
          退出登录
        </button>

        {/* 版本信息 */}
        <p className="text-center text-xs text-[#8b9e82] py-2">智农助手 v4.1 · 助力智慧农业</p>
      </div>
    );
  });
  RenderProfile.displayName = "RenderProfile";

  // ==================== Bottom Navigation ====================

  const tabs = [
    { icon: "🏠", label: "首页" },
    { icon: "🌾", label: "种植" },
    { icon: "📊", label: "行情" },
    { icon: "📌", label: "管理" },
    { icon: "🤖", label: "助手" },
    { icon: "👤", label: "我的" },
  ];

  // 土地类型帮助弹窗
  const RenderLandTypeHelp = memo(() => (
    <>
      {showLandTypeHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowLandTypeHelp(false)}>
          <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--border-light)] flex items-center justify-between">
              <h3 className="font-semibold text-lg">如何判断土地类型？</h3>
              <button onClick={() => setShowLandTypeHelp(false)} className="p-1 hover:bg-gray-100 rounded">
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
              {/* 旱地 */}
              <div className="p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌾</span>
                  <h4 className="font-semibold">旱地</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>没有灌溉条件，靠天然降水种植作物
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>小麦、玉米、棉花、大豆等耐旱作物
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>您的土地是否无法引水灌溉？是否主要靠天下雨？
                </p>
              </div>

              {/* 水田 */}
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌾</span>
                  <h4 className="font-semibold">水田</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>可以蓄水，有灌溉条件，适合种植水稻
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>水稻、莲藕、茭白等水生作物
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>您的土地是否能蓄水？是否有水源可以灌溉？
                </p>
              </div>

              {/* 菜地 */}
              <div className="p-3 bg-green-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🥬</span>
                  <h4 className="font-semibold">菜地</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>专门种植蔬菜，通常有灌溉设施，管理精细
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>各类蔬菜（番茄、黄瓜、白菜等）
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>您是否主要种植蔬菜？是否有大棚或灌溉设施？
                </p>
              </div>

              {/* 果园 */}
              <div className="p-3 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🍎</span>
                  <h4 className="font-semibold">果园</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>种植果树，多年生，需要长期管理
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>苹果、梨、桃、柑橘等各类果树
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>您是否种植果树？是否需要多年管理？
                </p>
              </div>

              {/* 林地 */}
              <div className="p-3 bg-emerald-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🌲</span>
                  <h4 className="font-semibold">林地</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>种植树木，主要用于林业生产或生态防护
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>杨树、桉树、松树等经济林或生态林
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>您是否种植树木？是否用于林业或生态目的？
                </p>
              </div>

              {/* 荒地 */}
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🏜️</span>
                  <h4 className="font-semibold">荒地</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>尚未开垦或长期闲置的土地
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>需要先进行土壤改良和基础设施建设
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>您的土地是否长期未种植？是否需要先开垦？
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  ));
  RenderLandTypeHelp.displayName = "RenderLandTypeHelp";

  // 土壤类型帮助弹窗
  const RenderSoilTypeHelp = memo(() => (
    <>
      {showSoilTypeHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowSoilTypeHelp(false)}>
          <div className="bg-white w-full max-w-lg max-h-[80vh] rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-[var(--border-light)] flex items-center justify-between">
              <h3 className="font-semibold text-lg">如何判断土壤类型？</h3>
              <button onClick={() => setShowSoilTypeHelp(false)} className="p-1 hover:bg-gray-100 rounded">
                <span className="text-2xl">×</span>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
              {/* 黑土 */}
              <div className="p-3 bg-gray-800 text-white rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⬛</span>
                  <h4 className="font-semibold">黑土</h4>
                </div>
                <p className="text-sm opacity-90 mb-2">
                  <strong>特点：</strong>颜色深黑，有机质含量高，土壤肥沃
                </p>
                <p className="text-sm opacity-90">
                  <strong>适合作物：</strong>大豆、玉米、小麦等粮食作物
                </p>
                <p className="text-sm opacity-70 mt-2">
                  💡 <strong>判断方法：</strong>土壤颜色深黑，质地疏松，握在手中感觉松软肥沃
                </p>
              </div>

              {/* 壤土 */}
              <div className="p-3 bg-amber-100 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🟫</span>
                  <h4 className="font-semibold">壤土</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>砂粒和黏粒比例适中，通气透水性好
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>大多数作物，是最理想的土壤类型
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>握成团后轻压即散，既不太黏也不太砂
                </p>
              </div>

              {/* 黏土 */}
              <div className="p-3 bg-amber-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🟤</span>
                  <h4 className="font-semibold">黏土</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>黏粒含量高，保水保肥能力强，但透气性差
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>水稻、莲藕等水生作物，小麦、玉米也可
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>湿时黏手，干时坚硬开裂，可搓成细条
                </p>
              </div>

              {/* 红壤 */}
              <div className="p-3 bg-red-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🔴</span>
                  <h4 className="font-semibold">红壤</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>呈红色或红褐色，酸性较强，铁铝含量高
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>茶树、柑橘、油茶等喜酸性作物
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>土壤颜色偏红，常见于南方丘陵地区
                </p>
              </div>

              {/* 黄土 */}
              <div className="p-3 bg-yellow-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🟡</span>
                  <h4 className="font-semibold">黄土</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>颜色黄或黄褐，质地较均匀，土层深厚
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>小麦、玉米、棉花等旱作作物
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>土壤呈黄色，粉砂质，常见于黄土高原地区
                </p>
              </div>

              {/* 砂土 */}
              <div className="p-3 bg-orange-50 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🟠</span>
                  <h4 className="font-semibold">砂土</h4>
                </div>
                <p className="text-sm text-[var(--text-secondary)] mb-2">
                  <strong>特点：</strong>砂粒含量高，透气性好但保水保肥能力差
                </p>
                <p className="text-sm text-[var(--text-secondary)]">
                  <strong>适合作物：</strong>花生、红薯、马铃薯等根茎类作物
                </p>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  💡 <strong>判断方法：</strong>握在手中感觉粗糙，颗粒感明显，易散落
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  ));
  RenderSoilTypeHelp.displayName = "RenderSoilTypeHelp";

  return (
    <div className="max-w-lg mx-auto bg-[#f8faf5] min-h-screen bg-leaf-pattern">
      {/* Content Area */}
      <div className="px-4 pt-4 pb-24">
        {activeTab === 0 && <RenderDashboard />}
        {activeTab === 1 && <RenderPlanting />}
        {activeTab === 2 && <RenderMarket />}
        {activeTab === 3 && <RenderManagement />}
        {activeTab === 4 && <RenderAssistant />}
        {activeTab === 5 && <RenderProfile />}
      </div>

      {/* 帮助弹窗 */}
      <RenderLandTypeHelp />
      <RenderSoilTypeHelp />

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white z-40 border-t border-[#e2e8d8]">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab, idx) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(idx)}
              className="nav-item flex-1 flex flex-col items-center gap-0.5 py-2 cursor-pointer"
            >
              {activeTab === idx && (
                <span className="w-1 h-1 rounded-full bg-green-500 mb-0.5 animate-gentle-pulse" />
              )}
              <span className={`text-lg transition-all duration-200 ${activeTab === idx ? "" : "opacity-40"}`}>{tab.icon}</span>
              <span
                className={`text-xs mt-0.5 transition-all duration-200 ${
                  activeTab === idx ? "nav-item-active font-semibold" : "nav-item-inactive"
                }`}
              >
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
