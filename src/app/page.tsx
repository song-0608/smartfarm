"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import { LocationIcon, BellIcon, ThermometerIcon, WindIcon, DropletIcon, ChevronRightIcon, SearchIcon, PlusIcon, XIcon, HomeIcon, UserIcon, LightbulbIcon, ClockIcon, EditIcon } from "./components/Icons";

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
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
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

// ==================== Main Component ====================

export default function Home() {
  // ---- Tab State ----
  const [activeTab, setActiveTab] = useState(0);

  // ---- Tab0: Dashboard ----
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [marketFull, setMarketFull] = useState<MarketResponse | null>(null);
  const [tasks, setTasks] = useState<Task[]>([
    { id: "1", text: "给番茄追施有机肥", done: false, date: getTodayStr(), category: "施肥", priority: "high" },
    { id: "2", text: "检查灌溉管道", done: false, date: getTodayStr(), category: "灌溉", priority: "medium" },
    { id: "3", text: "玉米田除草", done: true, date: getTodayStr(), category: "除草", priority: "low" },
    { id: "4", text: "喷洒生物农药防治蛱虫", done: false, date: getTodayStr(), category: "除虫", priority: "high" },
    { id: "5", text: "整理农具仓库", done: false, date: getTodayStr(), category: "其他", priority: "low" },
  ]);

  // ---- Tab1: Planting ----
  const [step, setStep] = useState(1);
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

  // ---- Tab2: Market ----
  const [selectedCrop, setSelectedCrop] = useState("");

  // ---- Location for Market ----
  const [userProvince, setUserProvince] = useState<string>("");
  const [locationLoading, setLocationLoading] = useState(false);

  // ---- Tab3: Management ----
  const [newTask, setNewTask] = useState("");
  const [newTaskCategory, setNewTaskCategory] = useState<"施肥" | "灌溉" | "除虫" | "除草" | "其他">("其他");
  const [newTaskPriority, setNewTaskPriority] = useState<"high" | "medium" | "low">("medium");
  const [growthRecords] = useState([
    { id: "g1", date: "05-01", text: "播种完成", img: "🌳" },
    { id: "g2", date: "05-08", text: "出苗整齐", img: "🌿" },
    { id: "g3", date: "05-15", text: "第一次追肥", img: "🧪" },
    { id: "g4", date: "05-22", text: "长势良好", img: "🌾" },
  ]);

  // ---- Tab4: Assistant ----
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { role: "ai", text: "你好！我是智农AI助手，可以帮你查天气、问价格、诊断病害、提供种植建议。有什么可以帮你的吗？" },
  ]);
  const [inputText, setInputText] = useState("");
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [videoCallActive, setVideoCallActive] = useState(false);
  const [cameraExpanded, setCameraExpanded] = useState(false);

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
      const analyzeData = await analyzeRes.json();
      setAnalysis(analyzeData.analysis || analyzeData);

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
          aiAnalysis: analyzeData.analysis || undefined,
        }),
      });
      const recommendData = await recommendRes.json();
      setRecommendation(recommendData);
      setStep(4);
    } catch {
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
  const processMessage = useCallback((text: string, source: "voice" | "text" = "text") => {
    // 1. 添加用户消息
    setChatMessages(prev => [...prev, { role: "user", text }]);

    // 2. 识别意图和实体
    const { intent, entities, confidence } = analyzeIntent(text);

    // 3. 更新对话上下文
    setConversationContext(prev => ({
      lastTopic: intent,
      mentionedCrop: entities.crop || prev.mentionedCrop,
      mentionedPest: entities.pest || prev.mentionedPest,
      pendingAction: "",
    }));

    // 4. 尝试执行操作
    const actionResult = executeAction(intent, entities, text);

    // 5. 生成回复
    setTimeout(() => {
      let reply = "";
      if (actionResult) {
        reply = actionResult;
      } else {
        reply = generateReply(intent, entities, text);
      }
      setChatMessages(prev => [...prev, { role: "ai", text: reply }]);
    }, source === "voice" ? 500 : 300);
  }, [analyzeIntent, executeAction, generateReply]);

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
    <div className="animate-fade-in-up space-y-6 pb-4">
      {/* Hero */}
      <div className="relative h-80 rounded-3xl overflow-hidden">
        <Image src="/images/hero-farm.jpg" alt="农田" fill className="img-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-white/70 text-sm">{getGreeting()}，{userName}</p>
          <h1 className="text-3xl font-bold mt-1 text-white">智农规划</h1>
          <p className="text-white/70 text-sm mt-2">让科技赋能每一寸土地</p>
          <button
            onClick={() => setActiveTab(1)}
            className="btn-outline mt-5 ripple-container"
          >
            开始规划 →
          </button>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="space-y-4">
        <div className="relative h-52 rounded-3xl overflow-hidden nature-card nature-card-hover animate-fade-in-up delay-100" style={{ opacity: 0 }}>
          <Image src="/images/smart-farming.jpg" alt="智能种植" fill className="img-cover" />
          <div className="card-overlay absolute inset-0" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-xl font-bold text-white">智能种植</h2>
            <p className="text-white/70 text-sm mt-1">AI分析土地，推荐最佳作物</p>
          </div>
        </div>

        <div className="relative h-52 rounded-3xl overflow-hidden nature-card nature-card-hover animate-fade-in-up delay-200" style={{ opacity: 0 }}>
          <Image src="/images/market-vegetables.jpg" alt="市场行情" fill className="img-cover" />
          <div className="card-overlay absolute inset-0" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-xl font-bold text-white">市场行情</h2>
            <p className="text-white/70 text-sm mt-1">实时农产品批发价格</p>
          </div>
        </div>

        <div className="relative h-52 rounded-3xl overflow-hidden nature-card nature-card-hover animate-fade-in-up delay-300" style={{ opacity: 0 }}>
          <Image src="/images/weather-sky.jpg" alt="天气服务" fill className="img-cover" />
          <div className="card-overlay absolute inset-0" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <h2 className="text-xl font-bold text-white">天气服务</h2>
            <p className="text-white/70 text-sm mt-1">精准气象数据助力农事</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in-up delay-400" style={{ opacity: 0 }}>
        <div className="nature-card rounded-2xl p-4 text-center nature-card-hover transition-all duration-300">
          <p className="text-2xl font-bold text-green-gradient">{tasks.filter((t) => !t.done).length}</p>
          <p className="text-xs text-[#8b9e82] mt-1">待办任务</p>
        </div>
        <div className="nature-card rounded-2xl p-4 text-center nature-card-hover transition-all duration-300">
          <p className="text-2xl font-bold text-earth-gradient">{marketData.length}</p>
          <p className="text-xs text-[#8b9e82] mt-1">行情品种</p>
        </div>
        <div className="nature-card rounded-2xl p-4 text-center nature-card-hover transition-all duration-300">
          <p className="text-2xl font-bold text-warm-gradient">{weather ? `${weather.temperature}℃` : "--"}</p>
          <p className="text-xs text-[#8b9e82] mt-1">当前温度</p>
        </div>
      </div>

      {/* Market Ticker */}
      {marketData.length > 0 && (
        <div className="nature-card rounded-2xl p-5 animate-fade-in-up delay-500" style={{ opacity: 0 }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#1a2e1a]">实时行情</h3>
            <button onClick={() => setActiveTab(2)} className="text-sm font-medium text-green-gradient cursor-pointer active:opacity-60 transition-all duration-200">
              查看详情 ›
            </button>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {marketData.slice(0, 8).map((item) => (
              <div key={item.name} className="flex-shrink-0 text-center min-w-[60px]">
                <span className="text-lg">{item.emoji}</span>
                <p className="text-xs text-[#8b9e82] mt-1">{item.name}</p>
                <p className="text-sm font-semibold text-[#1a2e1a]">{item.price}元</p>
                <p className={`text-xs ${item.trend === "up" ? "text-red-500" : item.trend === "down" ? "text-green-600" : "text-[#8b9e82]"}`}>
                  {item.trend === "up" ? "↑" : item.trend === "down" ? "↓" : "→"} {item.change || ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's Tasks */}
      <div className="nature-card rounded-2xl p-5 animate-fade-in-up delay-600" style={{ opacity: 0 }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-[#1a2e1a]">今日任务</h3>
          <button onClick={() => setActiveTab(3)} className="text-sm font-medium text-green-gradient cursor-pointer active:opacity-60 transition-all duration-200">
            全部 ›
          </button>
        </div>
        <div className="space-y-3">
          {tasks.slice(0, 3).map((task) => (
            <div key={task.id} className="flex items-center gap-3">
              <button
                onClick={() => toggleTask(task.id)}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 ${
                  task.done ? "bg-green-500 border-green-500" : "border-[#e2e8d8]"
                }`}
              >
                {task.done && <span className="text-white text-xs">✓</span>}
              </button>
              <span className={`text-sm ${task.done ? "line-through text-[#8b9e82]" : "text-[#4a6741]"}`}>
                {getCategoryIcon(task.category)} {task.text}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* AI Tip */}
      <div className="nature-card rounded-2xl p-5 animate-fade-in-up delay-700" style={{ opacity: 0 }}>
        <div className="flex items-start gap-3">
          <span className="text-2xl">💡</span>
          <div>
            <h3 className="text-sm font-bold text-[#1a2e1a]">今日农事小贴士</h3>
            <p className="text-xs text-[#8b9e82] mt-1">
              {getProverb()}。当前季节建议关注田间水肥管理，合理规划种植结构，提高土地利用率和经济效益。
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

    return (
      <div className="animate-fade-in-up space-y-5 pb-4">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-0 py-6">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-500 ${
                  s < step
                    ? "bg-green-500 text-white"
                    : s === step
                    ? "border-2 border-green-500 text-green-600 animate-gentle-pulse bg-white"
                    : "bg-gray-100 text-gray-400"
                }`}
              >
                {s < step ? "✓" : s}
              </div>
              {s < 4 && (
                <div className={`w-16 h-0.5 transition-all duration-500 ${s < step ? "bg-green-300" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Land Info */}
        {step === 1 && (
          <div className="space-y-5 animate-fade-in">
            {/* Quick Plan */}
            <div className="nature-card rounded-2xl p-5">
              <button
                onClick={handleQuickPlan}
                className="btn-primary w-full ripple-container flex items-center justify-center gap-2"
              >
                <span className="text-lg">✨</span>
                一键规划
              </button>
              <p className="text-xs text-[#8b9e82] text-center mt-2">自动填充默认参数，快速开始</p>
            </div>

            {/* Land Area */}
            <div className="nature-card rounded-2xl p-5">
              <label className="text-sm font-semibold text-[#1a2e1a] block mb-3">土地面积（亩）</label>
              <input
                type="number"
                value={landArea}
                onChange={(e) => setLandArea(e.target.value)}
                placeholder="请输入土地面积"
                className="input-nature"
              />
            </div>

            {/* Image Upload */}
            <div className="nature-card rounded-2xl p-5">
              <label className="text-sm font-semibold text-[#1a2e1a] block mb-3">拍照识别</label>
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
                  <img src={imagePreview} alt="预览" className="w-full h-44 object-cover rounded-2xl" />
                  <button
                    onClick={() => {
                      setImagePreview(null);
                      setImageBase64(null);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 backdrop-blur-md text-white text-xs cursor-pointer flex items-center justify-center active:scale-[0.9] transition-all duration-200 hover:bg-black/60"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-[#e2e8d8] rounded-2xl py-12 text-center cursor-pointer hover:border-green-300 hover:bg-green-50/50 active:scale-[0.98] transition-all duration-200 group"
                >
                  <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto group-hover:bg-green-100 transition-all duration-200">
                    <span className="text-2xl">📷</span>
                  </div>
                  <span className="text-sm text-[#8b9e82] mt-3 block font-medium">点击拍照或上传土地照片</span>
                  <span className="text-xs text-[#8b9e82] mt-1 block">支持 JPG、PNG 格式</span>
                </button>
              )}
            </div>

            {/* Land Type */}
            <div className="nature-card rounded-2xl p-5">
              <label className="text-sm font-semibold text-[#1a2e1a] block mb-3">土地类型</label>
              <div className="grid grid-cols-3 gap-2">
                {landTypes.map((lt) => (
                  <button
                    key={lt}
                    onClick={() => setLandType(lt)}
                    className={`p-3.5 rounded-2xl text-center cursor-pointer transition-all duration-200 active:scale-[0.95] ${
                      landType === lt
                        ? "bg-green-50 text-green-700 border border-green-300 shadow-[0_2px_8px_rgba(34,197,94,0.1)] scale-[1.02]"
                        : "bg-[#f8faf5] border border-[#e2e8d8] hover:bg-green-50/50"
                    }`}
                  >
                    <span className="text-xl block">{getLandIcon(lt)}</span>
                    <span className="text-xs mt-1 block">{lt}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Soil Type */}
            <div className="nature-card rounded-2xl p-5">
              <label className="text-sm font-semibold text-[#1a2e1a] block mb-3">土壤类型</label>
              <div className="grid grid-cols-3 gap-2">
                {soilTypes.map((st) => (
                  <button
                    key={st}
                    onClick={() => setSoilType(st)}
                    className={`p-3.5 rounded-2xl text-center cursor-pointer transition-all duration-200 active:scale-[0.95] ${
                      soilType === st
                        ? "bg-green-50 text-green-700 border border-green-300 shadow-[0_2px_8px_rgba(34,197,94,0.1)] scale-[1.02]"
                        : "bg-[#f8faf5] border border-[#e2e8d8] hover:bg-green-50/50"
                    }`}
                  >
                    <span className="text-xl block">{getSoilIcon(st)}</span>
                    <span className="text-xs mt-1 block">{st}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Terrain */}
            <div className="nature-card rounded-2xl p-5">
              <label className="text-sm font-semibold text-[#1a2e1a] block mb-3">地形</label>
              <div className="grid grid-cols-4 gap-2">
                {terrains.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTerrain(t)}
                    className={`p-3.5 rounded-2xl text-center cursor-pointer transition-all duration-200 active:scale-[0.95] ${
                      terrain === t
                        ? "btn-pill-active"
                        : "btn-pill-inactive"
                    }`}
                  >
                    <span className="text-xs">{t}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep(2)}
              className="btn-primary w-full ripple-container"
            >
              下一步 →
            </button>
          </div>
        )}

        {/* Step 2: Weather & Analyze */}
        {step === 2 && (
          <div className="space-y-5 animate-fade-in">
            <div className="nature-card rounded-2xl p-5">
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
              {gpsError && <p className="text-xs text-red-500 text-center mt-2">{gpsError}</p>}
            </div>

            {plantingWeather && (
              <div className="relative h-56 rounded-3xl overflow-hidden">
                <Image src="/images/weather-sky.jpg" alt="天气" fill className="img-cover" />
                <div className="hero-overlay absolute inset-0" />
                <div className="absolute inset-0 p-5 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-sm">当前天气</p>
                      <p className="text-3xl font-bold text-white mt-1">{plantingWeather.temperature}℃</p>
                      <p className="text-white/70 text-sm mt-1">{plantingWeather.description}</p>
                    </div>
                    <span className="text-5xl animate-float">{getWeatherEmoji(plantingWeather.weatherCode)}</span>
                  </div>
                  <div className="nature-card rounded-2xl p-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-xs text-[#8b9e82]">平均温度</p>
                        <p className="text-sm font-semibold text-[#1a2e1a]">{plantingWeather.avgTemperature}℃</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#8b9e82]">预计降水</p>
                        <p className="text-sm font-semibold text-[#1a2e1a]">{plantingWeather.totalPrecipitation}mm</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#8b9e82]">土壤湿度</p>
                        <p className="text-sm font-semibold text-[#1a2e1a]">{plantingWeather.avgSoilMoisture}%</p>
                      </div>
                    </div>
                    <p className="text-xs text-[#8b9e82] mt-3">
                      季节：{plantingWeather.season} · 适宜作物：{plantingWeather.suitableCrops.slice(0, 5).join("、")}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              className="btn-primary w-full ripple-container flex items-center justify-center gap-2"
            >
              <span className="text-lg">🚀</span>
              开始AI分析
            </button>
          </div>
        )}

        {/* Step 3: Loading */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center py-24 animate-fade-in">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-green-100 border-t-green-500 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">🌾</span>
              </div>
            </div>
            <p className="text-[#1a2e1a] mt-6 font-semibold text-lg">AI正在分析中...</p>
            <p className="text-sm text-[#8b9e82] mt-2">正在综合分析土地、天气和市场数据</p>
          </div>
        )}

        {/* Step 4: Results */}
        {step === 4 && recommendation && (
          <div className="space-y-5 animate-fade-in">
            {/* Land Summary */}
            <div className="nature-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-[#1a2e1a] mb-4">土地概况</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
                  <p className="text-xs text-[#8b9e82]">土地类型</p>
                  <p className="text-sm font-semibold text-[#1a2e1a] mt-1">{getLandIcon(landType || "旱地")} {landType || "旱地"}</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
                  <p className="text-xs text-[#8b9e82]">土壤类型</p>
                  <p className="text-sm font-semibold text-[#1a2e1a] mt-1">{getSoilIcon(soilType || "壤土")} {soilType || "壤土"}</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
                  <p className="text-xs text-[#8b9e82]">地形</p>
                  <p className="text-sm font-semibold text-[#1a2e1a] mt-1">{terrain || "平原"}</p>
                </div>
                <div className="bg-green-50 rounded-2xl p-3 border border-green-100">
                  <p className="text-xs text-[#8b9e82]">面积</p>
                  <p className="text-sm font-semibold text-[#1a2e1a] mt-1">{landArea || "10"}亩</p>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="nature-card rounded-2xl p-5">
              <h3 className="text-sm font-semibold text-[#1a2e1a] mb-4">推荐作物排名</h3>
              <div className="space-y-3">
                {((recommendation.recommendations as CropRecommendation[]) || []).slice(0, 5).map((crop, idx) => {
                  const rankColors = [
                    "from-green-500 to-emerald-600",
                    "from-amber-400 to-amber-500",
                    "from-sky-400 to-sky-500",
                    "",
                    "",
                  ];
                  return (
                    <div
                      key={crop.name}
                      className={`rounded-2xl p-4 border transition-all duration-200 ${
                        idx < 3
                          ? `bg-gradient-to-r ${rankColors[idx]} text-white border-transparent shadow-lg`
                          : "bg-white border-[#e2e8d8]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getCropEmoji(crop.name)}</span>
                          <span className={`font-semibold ${idx < 3 ? "text-white" : "text-[#1a2e1a]"}`}>
                            {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`} {crop.name}
                          </span>
                        </div>
                        <span
                          className={`text-xs px-2.5 py-1 rounded-full border ${
                            idx < 3
                              ? "bg-white/20 text-white border-white/30"
                              : getMatchStyle(crop.matchLevel)
                          }`}
                        >
                          {getMatchLabel(crop.matchLevel)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className={`h-2.5 rounded-full ${idx < 3 ? "bg-white/30" : "bg-green-100"}`}>
                            <div
                              className={`h-2.5 rounded-full transition-all duration-1000 ${idx < 3 ? "bg-white" : "bg-green-500"}`}
                              style={{ width: `${crop.score}%` }}
                            />
                          </div>
                        </div>
                        <span className={`text-sm font-bold ${idx < 3 ? "text-white" : "text-green-gradient"}`}>
                          {crop.score}分
                        </span>
                      </div>
                      <p className={`text-xs mt-2 ${idx < 3 ? "text-white/80" : "text-[#8b9e82]"}`}>
                        预计收益：{crop.profitPerMu}元/亩
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Revenue Estimate */}
            <div className="relative h-40 rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-600" />
              <div className="absolute inset-0 p-5 flex flex-col justify-center">
                <h3 className="text-white/70 font-medium">收益预估</h3>
                <p className="text-4xl font-bold text-white mt-2 animate-count-up">
                  {String(((recommendation.summary as Record<string, unknown>)?.bestChoice as Record<string, unknown>)?.profitPerMu || 0)}元/亩
                </p>
                <p className="text-sm text-white/70 mt-2">
                  最佳选择：{String(((recommendation.summary as Record<string, unknown>)?.bestChoice as Record<string, unknown>)?.name || "-")}
                </p>
                <button
                  onClick={() => setActiveTab(4)}
                  className="mt-3 bg-white/20 backdrop-blur-md text-white py-2 px-5 rounded-full text-sm font-medium cursor-pointer w-fit active:scale-[0.95] transition-all duration-200 hover:bg-white/30"
                >
                  查看详细分析
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowShareToast(true); setTimeout(() => setShowShareToast(false), 2000); }}
                className="btn-secondary flex-1 ripple-container flex items-center justify-center gap-2"
              >
                <span>📤</span>
                分享方案
              </button>
              <button
                onClick={() => { setStep(1); setRecommendation(null); }}
                className="btn-outline flex-1"
              >
                ← 重新规划
              </button>
            </div>

            {showShareToast && (
              <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 toast-nature text-[#1a2e1a] px-8 py-4 rounded-2xl text-sm animate-scale-in z-50">
                分享链接已复制到剪贴板
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ==================== Tab 2: Market (Nature Fresh) ====================

  const renderMarket = () => (
    <div className="animate-fade-in-up space-y-5 pb-4">
      {/* Market Header */}
      <div className="relative h-48 rounded-3xl overflow-hidden">
        <Image src="/images/market-vegetables.jpg" alt="市场" fill className="img-cover" />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-white/70 text-sm">农产品批发价格指数</p>
          <p className="text-4xl font-bold text-white mt-1">{marketFull?.index || "100.00"}</p>
          <div className="flex gap-3 mt-3">
            <span className="text-xs nature-card px-3 py-1 rounded-full text-red-500">
              ↑ 涨 {marketFull?.upCount || 0}
            </span>
            <span className="text-xs nature-card px-3 py-1 rounded-full text-green-600">
              ↓ 跌 {marketFull?.downCount || 0}
            </span>
            <span className="text-xs nature-card px-3 py-1 rounded-full text-[#8b9e82]">
              → 平 {marketFull?.stableCount || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Location Selector */}
      <div className="nature-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-[#1a2e1a] flex items-center gap-2">
            <LocationIcon size={16} className="text-green-500" />
            选择地区
          </h3>
          <button
            onClick={detectLocationFromGPS}
            disabled={locationLoading}
            className="text-xs font-medium text-sky-500 flex items-center gap-1 cursor-pointer active:opacity-60 transition-all duration-200"
          >
            {locationLoading ? (
              <>
                <span className="w-3 h-3 border-2 border-gray-200 border-t-sky-500 rounded-full animate-spin" />
                定位中...
              </>
            ) : (
              <>
                <LocationIcon size={14} />
                GPS定位
              </>
            )}
          </button>
        </div>
        <select
          value={userProvince}
          onChange={(e) => setUserProvince(e.target.value)}
          className="select-nature"
        >
          <option value="">全国（默认）</option>
          {PROVINCES.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      {/* Price List */}
      <div className="nature-card rounded-2xl p-5">
        <h3 className="text-sm font-semibold text-[#1a2e1a] mb-4">价格行情</h3>
        <div className="space-y-1">
          {marketFull?.items.map((item) => (
            <div
              key={item.name}
              className="flex items-center justify-between py-3 border-b border-[#e2e8d8] last:border-0 hover:bg-green-50/50 rounded-xl px-2 transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{item.emoji}</span>
                <span className="text-sm font-medium text-[#1a2e1a]">{item.name}</span>
              </div>
              <div className="flex items-center gap-3">
                {renderSparkline(item.sparkline || [], item.trend)}
                <span className="text-sm font-semibold text-[#1a2e1a] w-16 text-right tabular-nums">
                  {item.price.toFixed(2)}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    item.trend === "up"
                      ? "badge-up"
                      : item.trend === "down"
                      ? "badge-down"
                      : "badge-stable"
                  }`}
                >
                  {item.change || ""}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Price Chart */}
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
        {renderPriceChart()}
      </div>

      {/* Briefings */}
      {marketFull?.briefings && marketFull.briefings.length > 0 && (
        <div className="nature-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[#1a2e1a] mb-4">实时简报</h3>
          <div className="space-y-3">
            {marketFull.briefings.map((b, idx) => (
              <div
                key={idx}
                className={`border-l-4 ${getBriefingBorderColor(b.type)} pl-4 py-2 rounded-r-xl bg-green-50/50`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{getBriefingIcon(b.type)}</span>
                  <span className="text-xs font-semibold text-[#1a2e1a]">{b.title}</span>
                </div>
                <p className="text-xs text-[#8b9e82] line-clamp-2">{b.content}</p>
                <p className="text-xs text-[#8b9e82] mt-1">{b.time}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Macro Data */}
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

      {/* Data Source */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200">
        <h4 className="text-sm font-bold text-amber-700 mb-2">⚠️ 重要说明</h4>
        <ul className="text-xs text-[#8b9e82] space-y-1">
          <li>• 数据来源：农业农村部重点农产品市场信息平台</li>
          <li>• 价格类型：<strong className="text-[#4a6741]">批发价格</strong>（非零售价格）</li>
          <li>• 价格仅供参考，实际成交价格因地区和市场而异</li>
          <li>• 更新时间：{marketFull?.updateTime || "每日更新"}</li>
        </ul>
      </div>
    </div>
  );

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

    return (
      <div className="animate-fade-in-up space-y-5 pb-4">
        {/* Weather Banner */}
        <div className="relative h-40 rounded-3xl overflow-hidden">
          <Image src="/images/weather-sky.jpg" alt="天气" fill className="img-cover" />
          <div className="hero-overlay absolute inset-0" />
          <div className="absolute inset-0 flex flex-col justify-center p-6">
            <p className="text-white/70 text-sm">农事谚语</p>
            <p className="text-xl font-bold text-white mt-2">&ldquo;{getProverb()}&rdquo;</p>
          </div>
        </div>

        {/* Calendar */}
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

        {/* Task List */}
        <div className="nature-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[#1a2e1a] mb-4">任务列表</h3>
          <div className="space-y-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center gap-3 p-3 rounded-2xl border-l-4 ${getPriorityColor(task.priority)} bg-white transition-all duration-200 ${getPriorityGlow(task.priority)}`}
              >
                <button
                  onClick={() => toggleTask(task.id)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-200 ${
                    task.done ? "bg-green-500 border-green-500" : "border-[#e2e8d8]"
                  }`}
                >
                  {task.done && <span className="text-white text-xs">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${task.done ? "line-through text-[#8b9e82]" : "text-[#4a6741]"}`}>
                    {getCategoryIcon(task.category)} {task.text}
                  </p>
                  <p className="text-xs text-[#8b9e82] mt-0.5">{task.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Task */}
        <div className="nature-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-[#1a2e1a] mb-3">添加任务</h3>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {(["施肥", "灌溉", "除虫", "除草", "其他"] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setNewTaskCategory(cat)}
                className={`btn-pill flex-shrink-0 ${
                  newTaskCategory === cat
                    ? "btn-pill-active"
                    : "btn-pill-inactive"
                }`}
              >
                {getCategoryIcon(cat)} {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => setNewTaskPriority("high")}
              className={`btn-pill ${newTaskPriority === "high" ? "!bg-gradient-to-r !from-red-500 !to-red-600 !text-white !shadow-[0_2px_8px_rgba(239,68,68,0.2)]" : "btn-pill-inactive"}`}
            >
              紧急
            </button>
            <button
              onClick={() => setNewTaskPriority("medium")}
              className={`btn-pill ${newTaskPriority === "medium" ? "!bg-gradient-to-r !from-amber-400 !to-amber-500 !text-white !shadow-[0_2px_8px_rgba(245,158,11,0.2)]" : "btn-pill-inactive"}`}
            >
              一般
            </button>
            <button
              onClick={() => setNewTaskPriority("low")}
              className={`btn-pill ${newTaskPriority === "low" ? "!bg-gradient-to-r !from-sky-400 !to-sky-500 !text-white !shadow-[0_2px_8px_rgba(14,165,233,0.2)]" : "btn-pill-inactive"}`}
            >
              低
            </button>
          </div>
          <div className="flex gap-2 mt-3">
            <input
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="输入任务内容"
              className="input-nature flex-1"
              onKeyDown={(e) => e.key === "Enter" && addTask()}
            />
            <button
              onClick={addTask}
              className="btn-primary px-6 ripple-container"
            >
              添加
            </button>
          </div>
        </div>

        {/* Growth Records */}
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
      </div>
    );
  };

  // ==================== Tab 4: Assistant (Nature Fresh Chat) ====================

  const renderAssistant = () => (
    <div className="animate-fade-in-up flex flex-col" style={{ height: "calc(100vh - 140px)" }}>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pb-3 px-1">
        {chatMessages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            {msg.role === "ai" && (
              <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 mr-2 border-2 border-green-200">
                <Image src="/images/ai-assistant.jpg" alt="AI" width={32} height={32} className="img-cover" />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-green-500 text-white rounded-br-sm shadow-[0_4px_12px_rgba(34,197,94,0.2)]"
                  : "nature-card text-[#4a6741] rounded-bl-sm"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-3">
        {["查天气", "问价格", "诊断病害", "种植建议"].map((action) => (
          <button
            key={action}
            onClick={() => processVoiceQuery(action)}
            className={`btn-pill flex-shrink-0 ${
              action === "查天气" ? "btn-pill-active" : "btn-pill-inactive"
            }`}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="flex items-center gap-2 py-2">
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
          className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center cursor-pointer shadow-[0_4px_12px_rgba(34,197,94,0.25)] active:scale-[0.9] transition-all duration-200 flex-shrink-0"
        >
          <span className="text-white text-sm font-bold">↑</span>
        </button>
      </div>

      {/* Voice Button */}
      <div className="flex justify-center py-3">
        <button
          onClick={handleVoiceStart}
          className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
            isListening
              ? "bg-gradient-to-b from-red-500 to-red-600 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-gentle-pulse"
              : "bg-white border-2 border-[#e2e8d8] shadow-lg active:scale-[0.9] hover:border-green-300"
          }`}
        >
          <span className="text-2xl">{isListening ? "⏹" : "🎤"}</span>
        </button>
      </div>
      {voiceText && (
        <p className="text-xs text-center text-[#8b9e82] pb-1">识别结果：{voiceText}</p>
      )}

      {/* Camera Section */}
      <div className="border-t border-[#e2e8d8] pt-3">
        <div className="flex gap-2 mb-2">
          <button
            onClick={() => {
              if (cameraActive) {
                stopCamera();
              } else {
                startCamera();
              }
            }}
            className="flex-1 w-full flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all duration-200 hover:bg-green-50/50 active:bg-green-50 text-[#4a6741] text-sm"
          >
            {cameraActive ? "关闭相机" : "拍照识别"}
          </button>
          {!videoCallActive ? (
            <button
              onClick={handleVideoCall}
              className="btn-secondary flex-1 ripple-container flex items-center justify-center gap-2"
            >
              <span>📞</span>
              呼叫农业专家
            </button>
          ) : (
            <button
              onClick={() => setVideoCallActive(false)}
              className="flex-1 w-16 h-16 rounded-full bg-gradient-to-b from-red-500 to-red-600 flex items-center justify-center cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.25)] active:scale-[0.9] transition-all duration-200"
            >
              <span className="text-2xl">📵</span>
            </button>
          )}
        </div>

        {/* Camera Viewfinder */}
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

        {/* Captured Frame */}
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

        {/* Video Call Animation */}
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

  // ==================== Tab 5: Profile (Nature Fresh) ====================

  const renderProfile = () => (
    <div className="animate-fade-in-up space-y-5 pb-4">
      {/* Profile Header */}
      <div className="relative h-48 rounded-3xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-500 animate-gradient" />
        <div className="absolute inset-0 p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white/15 flex items-center justify-center border-2 border-white/25 backdrop-blur-sm">
            <span className="text-3xl">👨‍🌾</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{userName}</h2>
            <p className="text-sm text-white/70 mt-0.5">{farmName}</p>
          </div>
          <button
            onClick={() => {
              setChatMessages((prev) => [...prev, { role: "ai", text: "功能即将上线" }]);
              setActiveTab(4);
            }}
            className="text-xs font-medium bg-white/15 backdrop-blur-md px-4 py-1.5 rounded-full cursor-pointer active:scale-[0.95] transition-all duration-200 hover:bg-white/25 text-white"
          >
            编辑
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 animate-fade-in-up delay-100" style={{ opacity: 0 }}>
        <div className="nature-card rounded-2xl p-4 text-center nature-card-hover transition-all duration-300">
          <span className="text-xl block">🗺</span>
          <p className="text-2xl font-bold text-green-gradient mt-1">5</p>
          <p className="text-xs text-[#8b9e82] mt-0.5">地块数</p>
        </div>
        <div className="nature-card rounded-2xl p-4 text-center nature-card-hover transition-all duration-300">
          <span className="text-xl block">📥</span>
          <p className="text-2xl font-bold text-earth-gradient mt-1">12</p>
          <p className="text-xs text-[#8b9e82] mt-0.5">订单数</p>
        </div>
        <div className="nature-card rounded-2xl p-4 text-center nature-card-hover transition-all duration-300">
          <span className="text-xl block">💰</span>
          <p className="text-2xl font-bold text-warm-gradient mt-1">3.8万</p>
          <p className="text-xs text-[#8b9e82] mt-0.5">总收入</p>
        </div>
      </div>

      {/* Menu */}
      <div className="nature-card rounded-2xl overflow-hidden animate-fade-in-up delay-200" style={{ opacity: 0 }}>
        {[
          { icon: "📥", label: "我的订单", desc: "查看和管理订单", badge: 2 },
          { icon: "📊", label: "收益报告", desc: "收入与支出统计", badge: 0 },
          { icon: "🗺", label: "地块管理", desc: "管理我的地块", badge: 0 },
          { icon: "🔔", label: "消息通知", desc: "系统消息与提醒", badge: 5 },
          { icon: "⚙️", label: "设置", desc: "应用设置", badge: 0 },
          { icon: "❓", label: "帮助中心", desc: "常见问题解答", badge: 0 },
          { icon: "ℹ️", label: "关于我们", desc: "版本与团队信息", badge: 0 },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => {
              setChatMessages((prev) => [...prev, { role: "user", text: `打开${item.label}` }]);
              setTimeout(() => {
                setChatMessages((prev) => [
                  ...prev,
                  { role: "ai", text: `已收到您的"${item.label}"请求，正在为您处理中...` },
                ]);
              }, 500);
              setActiveTab(4);
            }}
            className="w-full flex items-center gap-3 px-4 py-4 cursor-pointer transition-all duration-200 active:bg-green-50 hover:bg-green-50/50"
          >
            <div className="flex items-center gap-3 flex-1">
              <span className="text-lg">{item.icon}</span>
              <div className="text-left flex-1">
                <p className="text-sm font-medium text-[#1a2e1a]">{item.label}</p>
                <p className="text-[10px] text-[#8b9e82]">{item.desc}</p>
              </div>
              {item.badge > 0 && (
                <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-[0_2px_6px_rgba(239,68,68,0.2)]">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
              <ChevronRightIcon size={16} className="text-[#8b9e82]" />
            </div>
          </button>
        ))}
      </div>

      {/* Version */}
      <p className="text-center text-xs text-[#8b9e82] pt-2">智农规划 v3.0.0</p>
    </div>
  );

  // ==================== Bottom Navigation ====================

  const tabs = [
    { icon: "🏠", label: "首页" },
    { icon: "🌾", label: "种植" },
    { icon: "📊", label: "行情" },
    { icon: "📌", label: "管理" },
    { icon: "🤖", label: "助手" },
    { icon: "👤", label: "我的" },
  ];

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
