"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { LocationIcon, BellIcon, ThermometerIcon, WindIcon, DropletIcon, ChevronRightIcon, SearchIcon, PlusIcon, XIcon, HomeIcon, UserIcon, LightbulbIcon, ClockIcon, EditIcon } from "./components/Icons";

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
    "大豆": "🫘", "番茄": "🥥", "黄瓜": "🥒",
    "辣椒": "🌶️", "西瓜": "🍊", "白菜": "🥬",
    "菠菜": "🥬", "大蒜": "🧄", "花生": "🥜",
    "红薯": "🍠", "茶叶": "🍵", "柑橘": "🍋",
    "土豆": "🥔", "茄子": "🍅", "生菜": "🥬",
    "高粱": "🌾", "莲藕": "🪷", "苹果": "🍇",
    "萝卜": "🥕", "生姜": "🥙", "蒜薹": "🧇",
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
  const [growthRecords] = useState([
    { id: "g1", date: "05-01", text: "播种完成", img: "🌳" },
    { id: "g2", date: "05-08", text: "出苗整齐", img: "🌿" },
    { id: "g3", date: "05-15", text: "第一次追肥", img: "🧪" },
    { id: "g4", date: "05-22", text: "长势良好", img: "🌾" },
  ]);

  // ---- Tab4: Assistant ----
  // 聊天记录 - 从localStorage加载
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === 'undefined') return [];
    return loadFromStorage(STORAGE_KEYS.chatMessages, [
      { role: "ai", text: "你好！我是智农AI助手，可以帮你查天气、问价格、诊断病害、提供种植建议。有什么可以帮你的吗？" },
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

  // ---- Tab5: Profile ----
  const [userName] = useState("张农场主");
  const [farmName] = useState("绿源生态农场");

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

  // 保存任务到localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.tasks, tasks);
  }, [tasks]);

  // 保存聊天记录到localStorage
  useEffect(() => {
    saveToStorage(STORAGE_KEYS.chatMessages, chatMessages);
  }, [chatMessages]);

  // ---- Load initial data ----
  useEffect(() => {
    if (activeTab === 2 || activeTab === 0) {
      const params = new URLSearchParams();
      if (userProvince) params.set("province", userProvince);
      fetch(`/api/market?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            const items: MarketItem[] = (data.data || []).map(
              (c: { name: string; currentPrice: number; trend: string; priceChange: number; history: number[] }) => ({
                name: c.name,
                price: c.currentPrice,
                trend: c.trend as "up" | "down" | "stable",
                change: `${c.priceChange > 0 ? "+" : ""}${c.priceChange}%`,
                emoji: getCropEmoji(c.name),
                sparkline: (c.history || []).map((h: number | { price: number }) => typeof h === "number" ? h : h.price),
              })
            );
            setMarketData(items);
            setMarketFull({
              items,
              index: data.summary?.averageIndex || 100,
              indexChange: 0,
              upCount: data.summary?.upCount || 0,
              downCount: data.summary?.downCount || 0,
              stableCount: data.summary?.stableCount || 0,
              history: [],
              briefings: (data.briefings || []).map(
                (b: { type: string; title: string; content: string; time: string }) => ({
                  type: b.type as "政策" | "行情" | "预警" | "机会",
                  title: b.title,
                  content: b.content,
                  time: b.time,
                })
              ),
              macro: {
                seasonForecast: data.macro?.seasonalForecast,
                policyInfo: data.macro?.policyInfo,
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

  // ---- Cleanup camera on unmount ----
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
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
            setPlantingWeather({
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
            });
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

    // 意图识别
    if (/天气|温度|下雨|降水|湿度/.test(lowerText)) {
      intent = "weather";
      confidence = 0.9;
    } else if (/价格|行情|多少钱|收购价|市场价/.test(lowerText)) {
      intent = "price";
      confidence = 0.9;
    } else if (/病|虫|害|打药|防治|症状/.test(lowerText)) {
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
  const processMessage = useCallback(async (text: string, source: "voice" | "text" = "text") => {
    // 1. 添加用户消息
    setChatMessages(prev => [...prev, { role: "user", text }]);

    // 2. 显示AI正在输入状态
    setIsTyping(true);

    // 3. 识别意图和实体（用于本地功能）
    const { intent, entities } = analyzeIntent(text);

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
      setIsTyping(false);
      return;
    }

    // 6. 调用AI API获取智能回复
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
        setChatMessages(prev => [...prev, { role: "ai", text: data.reply }]);
      } else if (data.error) {
        // API出错，使用本地回复作为后备
        const fallbackReply = generateReply(intent, entities, text);
        setChatMessages(prev => [...prev, { role: "ai", text: fallbackReply }]);
      }
    } catch (error) {
      console.error('AI调用失败:', error);
      // 网络失败，使用本地回复作为后备
      const fallbackReply = generateReply(intent, entities, text);
      setChatMessages(prev => [...prev, { role: "ai", text: fallbackReply }]);
    }

    setIsTyping(false);
  }, [analyzeIntent, executeAction, generateReply, chatMessages]);

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

  // processVoiceQuery 已重构为 processMessage，保留此函数名以兼容现有调用
  const processVoiceQuery = useCallback(
    (text: string) => {
      processMessage(text, "voice");
    },
    [processMessage]
  );

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

  const handlePhotoAnalyze = useCallback(() => {
    if (!capturedFrame) return;
    setChatMessages((prev) => [...prev, { role: "user", text: "[发送了一张照片，请分析]" }]);
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: "已收到您的照片。根据AI分析：\n1. 作物整体长势良好\n2. 叶片颜色正常，无明显缺素症状\n3. 建议继续保持当前水肥管理\n4. 注意预防近期可能出现的病虫害\n\n如需更详细的分析，建议使用种植规划中的AI分析功能。",
        },
      ]);
    }, 1500);
    stopCamera();
  }, [capturedFrame, stopCamera]);

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

  const renderDashboard = () => (
    <div className="animate-fade-in-up space-y-4 pb-4">
      {/* 顶部问候区域 */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white text-xl shadow-lg shadow-green-200">
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
          <button className="p-2.5 rounded-full hover:bg-green-50 transition-colors cursor-pointer active:scale-95">
            <LocationIcon className="w-5 h-5 text-green-600" />
          </button>
          <button className="p-2.5 rounded-full hover:bg-green-50 transition-colors cursor-pointer active:scale-95 relative">
            <BellIcon className="w-5 h-5 text-green-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </div>
      </div>

      {/* 天气卡片 */}
      <div className="nature-card rounded-2xl p-4 shadow-sm">
        {weather ? (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="text-4xl">{getWeatherEmoji(weather.weatherCode)}</div>
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
            {/* 农事建议标签 */}
            <div className="flex gap-2 flex-wrap">
              {getFarmingAdvice(weather).map((advice, i) => (
                <span key={i} className="px-3 py-1 bg-green-50 text-green-700 text-xs rounded-full border border-green-200">
                  {advice}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-6">
            <div className="w-8 h-8 border-2 border-green-200 border-t-green-500 rounded-full animate-spin"></div>
            <p className="mt-3 text-sm text-[#8b9e82]">加载天气...</p>
          </div>
        )}
      </div>

      {/* 今日任务卡片 */}
      <div className="nature-card rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#1a2e1a]">今日任务</h3>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
              {tasks.filter(t => !t.done).length}项待办
            </span>
          </div>
          <span 
            className="text-sm text-green-600 cursor-pointer active:opacity-60 transition-opacity" 
            onClick={() => setActiveTab(3)}
          >
            查看全部 →
          </span>
        </div>
        <div className="space-y-2">
          {tasks.filter(t => !t.done).slice(0, 3).map(task => (
            <div key={task.id} className="flex items-center gap-3 py-2 border-b border-[#e2e8d8] last:border-0">
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggleTask(task.id)}
                className="w-5 h-5 rounded border-green-300 text-green-600 focus:ring-green-500 cursor-pointer"
              />
              <span className="text-sm text-[#4a6741]">
                {getCategoryIcon(task.category)} {task.text}
              </span>
            </div>
          ))}
          {tasks.filter(t => !t.done).length === 0 && (
            <p className="text-center text-[#8b9e82] py-4 text-sm">今日任务已全部完成 🎉</p>
          )}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: '🌱', label: '种植规划', tab: 1 },
          { icon: '📊', label: '市场行情', tab: 2 },
          { icon: '📷', label: '拍照识别', tab: 4 },
          { icon: '🤖', label: 'AI助手', tab: 4 },
        ].map((item, i) => (
          <button
            key={i}
            onClick={() => setActiveTab(item.tab)}
            className="nature-card p-3 flex flex-col items-center gap-2 active:scale-95 transition-transform cursor-pointer shadow-sm rounded-2xl"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs text-[#4a6741]">{item.label}</span>
          </button>
        ))}
      </div>

      {/* 市场动态 */}
      {marketData.length > 0 && (
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
            {marketData.slice(0, 3).map((item, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-[#e2e8d8] last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.emoji}</span>
                  <span className="text-sm text-[#4a6741]">{item.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#1a2e1a]">¥{item.price.toFixed(2)}</span>
                  <span className={
                    item.trend === 'up' 
                      ? 'text-red-500 text-sm' 
                      : item.trend === 'down' 
                        ? 'text-green-500 text-sm' 
                        : 'text-gray-400 text-sm'
                  }>
                    {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '−'}
                  </span>
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

  // ==================== Tab 1: Planting (Nature Fresh Wizard) ====================

  const renderPlanting = () => {
    const landTypes = ["旱地", "水田", "菜地", "果园", "林地", "荒地"];
    const soilTypes = ["黑土", "壤土", "黏土", "红壤", "黄土", "砂土"];
    const terrains = ["平原", "山地", "丘陵", "坡地"];

    const stepTitles = ["土地信息", "天气分析", "AI分析", "规划结果"];
    const stepIcons = ["🌾", "🌤️", "🚀", "📊"];

    // 判断步骤是否完成
    const isStepComplete = (s: number) => s < step;
    // 判断步骤是否可展开（已完成的步骤可以回看）
    const canExpand = (s: number) => s < step || s === step;

    return (
      <div className="animate-fade-in-up space-y-4 pb-4">
        {/* 进度条 */}
        <div className="nature-card rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#1a2e1a]">规划进度</span>
            <span className="text-xs text-[#8b9e82]">{step} / 4 步</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
              style={{ width: `${(step / 4) * 100}%` }}
            />
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
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
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
                              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/40 backdrop-blur-md text-white text-xs cursor-pointer flex items-center justify-center"
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

                      {/* Land Type */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-[#1a2e1a]">土地类型</label>
                          <button
                            onClick={() => setShowLandTypeHelp(true)}
                            className="text-sm text-green-600 flex items-center gap-1"
                          >
                            <span>?</span>
                            <span>如何判断？</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {landTypes.map((lt) => (
                            <button
                              key={lt}
                              onClick={() => setLandType(lt)}
                              className={`p-2.5 rounded-xl text-center cursor-pointer transition-all ${
                                landType === lt
                                  ? "bg-green-50 text-green-700 border border-green-300"
                                  : "bg-[#f8faf5] border border-[#e2e8d8] hover:bg-green-50/50"
                              }`}
                            >
                              <span className="text-lg block">{getLandIcon(lt)}</span>
                              <span className="text-xs mt-0.5 block">{lt}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Soil Type */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-sm font-semibold text-[#1a2e1a]">土壤类型</label>
                          <button
                            onClick={() => setShowSoilTypeHelp(true)}
                            className="text-sm text-green-600 flex items-center gap-1"
                          >
                            <span>?</span>
                            <span>如何判断？</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {soilTypes.map((st) => (
                            <button
                              key={st}
                              onClick={() => setSoilType(st)}
                              className={`p-2.5 rounded-xl text-center cursor-pointer transition-all ${
                                soilType === st
                                  ? "bg-green-50 text-green-700 border border-green-300"
                                  : "bg-[#f8faf5] border border-[#e2e8d8] hover:bg-green-50/50"
                              }`}
                            >
                              <span className="text-lg block">{getSoilIcon(st)}</span>
                              <span className="text-xs mt-0.5 block">{st}</span>
                            </button>
                          ))}
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
                              推荐 {((recommendation.recommendations as CropRecommendation[]) || []).length} 种作物
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

                      {/* 推荐作物 */}
                      <div>
                        <p className="text-sm font-semibold text-[#1a2e1a] mb-2">推荐作物排名</p>
                        <div className="space-y-2">
                          {((recommendation.recommendations as CropRecommendation[]) || []).slice(0, 3).map((crop, idx) => (
                            <div
                              key={crop.name}
                              className={`rounded-xl p-3 ${
                                idx === 0 
                                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" 
                                  : idx === 1 
                                    ? "bg-gradient-to-r from-amber-400 to-amber-500 text-white"
                                    : "bg-gradient-to-r from-sky-400 to-sky-500 text-white"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">{getCropEmoji(crop.name)}</span>
                                  <span className="font-semibold">
                                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉"} {crop.name}
                                  </span>
                                </div>
                                <span className="text-sm font-bold">{crop.score}分</span>
                              </div>
                              <p className="text-xs mt-1 opacity-80">预计收益：{crop.profitPerMu}元/亩</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 收益预估 */}
                      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
                        <p className="text-white/70 text-sm">收益预估</p>
                        <p className="text-3xl font-bold mt-1">
                          {String(((recommendation.summary as Record<string, unknown>)?.bestChoice as Record<string, unknown>)?.profitPerMu || 0)}元/亩
                        </p>
                        <p className="text-sm text-white/70 mt-1">
                          最佳选择：{String(((recommendation.summary as Record<string, unknown>)?.bestChoice as Record<string, unknown>)?.name || "-")}
                        </p>
                      </div>

                      {/* 操作按钮 */}
                      {step === 4 && (
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setShowShareToast(true); setTimeout(() => setShowShareToast(false), 2000); }}
                            className="btn-secondary flex-1 ripple-container flex items-center justify-center gap-2"
                          >
                            <span>📤</span>
                            分享方案
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
  };

  // ==================== Tab 2: Market (Nature Fresh) ====================

  const renderMarket = () => {
    const categories = ["全部", "蔬菜", "水果", "粮食"];
    const categoryEmojis: Record<string, string[]> = {
      "蔬菜": ["🥬", "🥒", "🌶️", "🥕", "🧄", "🥔", "🍅", "🍆"],
      "水果": ["🍎", "🍊", "🍋", "🍇", "🍉", "🍓", "🍑", "🍒"],
      "粮食": ["🌾", "🌽", "🫘", "🥜", "🍠", "🍚", "🌿", "🌾"],
    };

    const getFilteredItems = () => {
      if (!marketFull?.items) return [];
      if (marketTab === 0) return marketFull.items;
      const categoryName = categories[marketTab];
      // 使用名称关键词匹配代替emoji匹配
      return marketFull.items.filter(item => {
        const name = item.name;
        if (categoryName === "蔬菜") return /菜|椒|茄|瓜|豆|菇|笋|葱|姜|蒜|菠|芹|苋|芥|莴|茼|蕹|芋|藕|笋|菌|番茄|黄瓜|白菜|萝卜|土豆|红薯|南瓜|冬瓜/i.test(name);
        if (categoryName === "水果") return /果|瓜|莓|桃|梨|苹|橘|橙|柚|柿|枣|葡|荔|芒|香|樱|李|杏|柿|枣|柑|橘/i.test(name);
        if (categoryName === "粮食") return /米|麦|玉|谷|粮|豆|薯|芋|稻|高粱|谷子|燕麦|荞麦|青稞/i.test(name);
        return true;
      });
    };

    const filteredItems = getFilteredItems();

    return (
      <div className="animate-fade-in-up space-y-4 pb-4">
        {/* 顶部概览卡片 */}
        <div className="nature-card p-4 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-3xl">
          <p className="text-sm opacity-90">农产品价格指数</p>
          <div className="flex items-end gap-2 mt-1">
            <span className="text-4xl font-bold">{marketFull?.index?.toFixed(2) || "100.00"}</span>
            <span className={`${(marketFull?.indexChange || 0) >= 0 ? "text-red-200" : "text-green-200"} text-sm mb-1`}>
              {(marketFull?.indexChange || 0) >= 0 ? "↑" : "↓"} {Math.abs(marketFull?.indexChange || 0).toFixed(2)}
            </span>
          </div>
          <div className="flex gap-4 mt-3 text-sm">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-300"></span>
              涨 {marketFull?.upCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-300"></span>
              跌 {marketFull?.downCount || 0}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white/50"></span>
              平 {marketFull?.stableCount || 0}
            </span>
          </div>
        </div>

        {/* 分类筛选 */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide px-1">
          {categories.map((cat, i) => (
            <button
              key={i}
              onClick={() => setMarketTab(i)}
              className={`btn-pill whitespace-nowrap ${marketTab === i ? "btn-pill-active" : "btn-pill-inactive"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 价格列表 */}
        <div className="nature-card rounded-2xl divide-y divide-[#e2e8d8]">
          {filteredItems.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-[#8b9e82]">暂无该分类数据</p>
            </div>
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
                  {renderSparkline(item.sparkline || [], item.trend)}
                  <div className="text-right">
                    <p className="font-semibold text-[#1a2e1a]">¥{item.price.toFixed(2)}</p>
                    <p className={`text-sm ${item.trend === "up" ? "text-red-500" : item.trend === "down" ? "text-green-500" : "text-gray-400"}`}>
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
                className={`btn-pill whitespace-nowrap ${
                  selectedCrop === item.name
                    ? "btn-pill-active"
                    : "btn-pill-inactive"
                }`}
              >
                {item.emoji} {item.name}
              </button>
            ))}
          </div>
          {!marketFull?.items || marketFull.items.length === 0 ? (
            <div className="text-center py-8 text-[#8b9e82]">
              <p>暂无走势图数据</p>
              <p className="text-sm mt-1">数据正在更新中...</p>
            </div>
          ) : !selectedCrop ? (
            <div className="text-center py-8 text-[#8b9e82]">
              <p>请选择作物查看价格走势</p>
            </div>
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
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
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
  };

  // ==================== Tab 3: Management (Nature Fresh) ====================

  const renderManagement = () => {
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

        {/* 进度条 */}
        <div className="nature-card p-4 rounded-2xl">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#4a6741]">本周进度</span>
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
  };

  // ==================== Tab 4: Assistant (Nature Fresh Chat) ====================

  const renderAssistant = () => {
    const quickQuestions = [
      { icon: "🌱", text: "今天适合种什么？" },
      { icon: "🐛", text: "如何防治蚜虫？" },
      { icon: "💰", text: "最近菜价怎么样？" },
      { icon: "🌤️", text: "明天天气如何？" },
    ];

    const handleQuickQuestion = (text: string) => {
      setInputText(text);
      setTimeout(() => {
        processMessage(text, "text");
      }, 100);
    };

    return (
      <div className="animate-fade-in-up flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
        {/* 欢迎卡片 */}
        <div className="nature-card p-4 mb-4 bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-2xl shadow-[0_4px_12px_rgba(34,197,94,0.25)]">
              🤖
            </div>
            <div>
              <h3 className="font-semibold text-[#1a2e1a]">智农助手</h3>
              <p className="text-sm text-[#8b9e82]">您的专属农业顾问</p>
            </div>
          </div>
        </div>

        {/* 聊天区域 */}
        <div className="flex-1 overflow-y-auto space-y-3 pb-4 px-1 scrollbar-hide">
          {chatMessages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {msg.role === "ai" && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-lg flex-shrink-0 mr-2 shadow-[0_2px_8px_rgba(34,197,94,0.2)]">
                  🤖
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-green-500 text-white rounded-br-sm shadow-[0_4px_12px_rgba(34,197,94,0.2)]"
                    : "nature-card text-[#4a6741] rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          {/* AI正在输入动画 */}
          {isTyping && (
            <div className="flex justify-start animate-fade-in">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-lg flex-shrink-0 mr-2 shadow-[0_2px_8px_rgba(34,197,94,0.2)]">
                🤖
              </div>
              <div className="nature-card p-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* 快捷问题 */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {quickQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleQuickQuestion(q.text)}
              className="btn-pill whitespace-nowrap flex items-center gap-1 flex-shrink-0"
            >
              <span>{q.icon}</span>
              <span>{q.text}</span>
            </button>
          ))}
        </div>

        {/* 输入区域 */}
        <div className="flex gap-2 items-center pt-2">
          <button
            onClick={handleVoiceStart}
            className={`p-3 rounded-full flex-shrink-0 cursor-pointer transition-all duration-300 ${
              isListening
                ? "bg-gradient-to-b from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-gentle-pulse"
                : "bg-[#f8faf5] text-green-600 active:scale-95 transition-transform border border-[#e2e8d8]"
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
            className="p-3 rounded-full bg-green-500 text-white disabled:opacity-50 active:scale-95 transition-transform flex-shrink-0 shadow-[0_4px_12px_rgba(34,197,94,0.25)] cursor-pointer"
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
              className="flex-1 w-full flex items-center justify-center gap-2 p-3 rounded-2xl cursor-pointer transition-all duration-200 bg-[#f8faf5] hover:bg-green-50/50 active:bg-green-50 text-[#4a6741] text-sm border border-[#e2e8d8]"
            >
              <span>📷</span>
              {cameraActive ? "关闭相机" : "拍照识别"}
            </button>
            {!videoCallActive ? (
              <button
                onClick={handleVideoCall}
                className="btn-secondary flex-1 ripple-container flex items-center justify-center gap-2"
              >
                <span>📞</span>
                呼叫专家
              </button>
            ) : (
              <button
                onClick={() => setVideoCallActive(false)}
                className="flex-1 p-3 rounded-2xl bg-gradient-to-b from-red-500 to-red-600 text-white flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.25)] active:scale-[0.9] transition-all duration-200"
              >
                <span>📵</span>
                挂断
              </button>
            )}
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

          {/* 视频通话动画 */}
          {videoCallActive && (
            <div className="flex flex-col items-center py-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-sky-400 to-green-500 flex items-center justify-center animate-blink shadow-[0_2px_12px_rgba(14,165,233,0.25)]">
                <span className="text-2xl">👨‍🌾</span>
              </div>
              <p className="text-sm text-[#8b9e82] mt-2">正在连接农业专家...</p>
            </div>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  };

  // ==================== Tab 5: Profile (Nature Fresh) ====================

  const renderProfile = () => {
    const menuItems = [
      { icon: "⚙️", label: "设置", desc: "语言、通知、主题", onClick: () => {} },
      { icon: "❓", label: "帮助中心", desc: "常见问题、联系客服", onClick: () => {} },
      { icon: "ℹ️", label: "关于我们", desc: "版本信息、开发团队", onClick: () => {} },
      { icon: "💬", label: "意见反馈", desc: "帮助我们做得更好", onClick: () => {} },
    ];

    const handleMenuClick = (label: string) => {
      setChatMessages((prev) => [...prev, { role: "user", text: `打开${label}` }]);
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          { role: "ai", text: `已收到您的"${label}"请求，正在为您处理中...` },
        ]);
      }, 500);
      setActiveTab(4);
    };

    const handleLogout = () => {
      setChatMessages((prev) => [...prev, { role: "ai", text: "退出登录功能即将上线" }]);
      setActiveTab(4);
    };

    return (
      <div className="animate-fade-in-up space-y-4 pb-4">
        {/* 用户信息卡片 */}
        <div className="nature-card p-6 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 text-white rounded-3xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl border-2 border-white/30">
              👨‍🌾
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{userName}</h2>
              <p className="text-sm opacity-90 flex items-center gap-1 mt-1">
                <LocationIcon className="w-4 h-4" />
                {userProvince || "未设置地区"}
              </p>
            </div>
            <button
              onClick={() => {
                setChatMessages((prev) => [...prev, { role: "ai", text: "编辑资料功能即将上线" }]);
                setActiveTab(4);
              }}
              className="p-2 rounded-full bg-white/20 active:scale-95 transition-transform cursor-pointer"
            >
              <EditIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 菜单列表 */}
        <div className="nature-card rounded-2xl overflow-hidden divide-y divide-[#e2e8d8]">
          {menuItems.map((item, i) => (
            <button
              key={i}
              onClick={() => handleMenuClick(item.label)}
              className="w-full p-4 flex items-center gap-4 active:bg-green-50 transition-colors text-left cursor-pointer"
            >
              <span className="text-2xl">{item.icon}</span>
              <div className="flex-1">
                <p className="font-medium text-[#1a2e1a]">{item.label}</p>
                <p className="text-sm text-[#8b9e82]">{item.desc}</p>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-[#8b9e82]" />
            </button>
          ))}
        </div>

        {/* 版本信息 */}
        <div className="text-center text-sm text-[#8b9e82] pt-4">
          <p>智农规划 v2.0</p>
          <p className="text-xs mt-1">© 2024 智农科技</p>
        </div>

        {/* 退出按钮 */}
        <button
          onClick={handleLogout}
          className="w-full btn-outline text-red-600 border-red-200 hover:bg-red-50 cursor-pointer"
        >
          退出登录
        </button>
      </div>
    );
  };

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
  const renderLandTypeHelp = () => (
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
  );

  // 土壤类型帮助弹窗
  const renderSoilTypeHelp = () => (
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
  );

  return (
    <div className="max-w-lg mx-auto bg-[#f8faf5] min-h-screen bg-leaf-pattern">
      {/* Content Area */}
      <div className="px-4 pt-4 pb-24">
        {activeTab === 0 && renderDashboard()}
        {activeTab === 1 && renderPlanting()}
        {activeTab === 2 && renderMarket()}
        {activeTab === 3 && renderManagement()}
        {activeTab === 4 && renderAssistant()}
        {activeTab === 5 && renderProfile()}
      </div>

      {/* 帮助弹窗 */}
      {renderLandTypeHelp()}
      {renderSoilTypeHelp()}

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
