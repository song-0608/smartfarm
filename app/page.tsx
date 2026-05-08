"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/* ==================== 类型定义 ==================== */
interface WeatherData {
  temperature?: number;
  weatherCode?: number;
  windSpeed?: number;
  humidity?: number;
  description?: string;
  avgTemperature?: number;
  totalPrecipitation?: number;
  avgSoilMoisture?: number;
  season?: string;
  suitableCrops?: string[];
  soilMoisture?: number;
  soilTemperature?: number;
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
  id: number;
  text: string;
  done: boolean;
  date: string;
  category: "施肥" | "灌溉" | "除虫" | "除草" | "其他";
  priority: "high" | "medium" | "low";
}

interface MarketItem {
  name: string;
  price: string;
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
  items?: MarketItem[];
  index?: number;
  indexChange?: string;
  upCount?: number;
  downCount?: number;
  stableCount?: number;
  history?: Array<{ date: string; price: number }>;
  briefings?: MarketBriefing[];
  macro?: MarketMacro;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

/* ==================== 工具函数 ==================== */
function getWeatherEmoji(code?: number): string {
  if (code === undefined || code === null) return "\u2600\uFE0F";
  if (code === 0) return "\u2600\uFE0F";
  if (code <= 2) return "\u26C5";
  if (code === 3) return "\u2601\uFE0F";
  if (code >= 45 && code <= 48) return "\uD83C\uDF2B\uFE0F";
  if (code >= 51 && code <= 67) return "\uD83C\uDF27\uFE0F";
  if (code >= 71 && code <= 77) return "\uD83C\uDF28\uFE0F";
  if (code >= 80 && code <= 82) return "\uD83C\uDF26\uFE0F";
  if (code >= 95) return "\u26C8\uFE0F";
  return "\uD83C\uDF24\uFE0F";
}

function getMatchStyle(level: "strong" | "medium" | "weak"): string {
  if (level === "strong") return "bg-green-50 border-green-300 text-green-800";
  if (level === "medium") return "bg-yellow-50 border-yellow-300 text-yellow-800";
  return "bg-stone-50 border-stone-300 text-stone-600";
}

function getMatchLabel(level: "strong" | "medium" | "weak"): string {
  if (level === "strong") return "\u9AD8\u5EA6\u5339\u914D";
  if (level === "medium") return "\u4E2D\u5EA6\u5339\u914D";
  return "\u4E00\u822C\u5339\u914D";
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "\u65E9\u4E0A\u597D";
  if (h < 18) return "\u4E0B\u5348\u597D";
  return "\u665A\u4E0A\u597D";
}

function getLandIcon(type: string): string {
  const icons: Record<string, string> = { "\u6C34\u7530": "\uD83C\uDF3E", "\u65F1\u5730": "\uD83C\uDF3D", "\u679C\u56ED": "\uD83C\uDF47", "\u83DC\u5730": "\uD83E\uDD6C", "\u8336\u56ED": "\uD83C\uDF75", "\u8352\u5730": "\uD83C\uDF31" };
  return icons[type] || "\uD83C\uDF3F";
}

function getSoilIcon(type: string): string {
  const icons: Record<string, string> = { "\u58E4\u571F": "\uD83E\uDDEA", "\u9ECF\u571F": "\uD83E\uDEA8", "\u7802\u571F": "\uD83C\uDFDC\uFE0F", "\u9ED1\u571F": "\u26AB", "\u7EA2\u58E4": "\uD83D\uDFE0", "\u9EC4\u571F": "\uD83D\uDFE1" };
  return icons[type] || "\uD83C\uDF31";
}

function getCategoryIcon(cat: string): string {
  const icons: Record<string, string> = { "\u65BD\u80A5": "\uD83E\uDDEA", "\u704C\u6E89": "\uD83D\uDCA7", "\u9664\u866B": "\uD83D\uDC1B", "\u9664\u8349": "\uD83C\uDF3F", "\u5176\u4ED6": "\uD83D\uDCDD" };
  return icons[cat] || "\uD83D\uDCDD";
}

function getPriorityColor(p: string): string {
  if (p === "high") return "border-l-red-500";
  if (p === "medium") return "border-l-amber-500";
  return "border-l-green-500";
}

function getMonthActivities(): string[] {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return ["\u6625\u8015\u6574\u5730", "\u64AD\u79CD\u80B2\u82D7", "\u65BD\u57FA\u80A5", "\u704C\u6E89\u6625\u6C34"];
  if (m >= 6 && m <= 8) return ["\u8FFD\u80A5\u7BA1\u7406", "\u75C5\u866B\u5BB3\u9632\u6CBB", "\u4E2D\u8015\u9664\u8349", "\u6392\u6D9D\u6297\u65F1"];
  if (m >= 9 && m <= 11) return ["\u79CB\u6536\u51C6\u5907", "\u91C7\u6536\u6652\u5E72", "\u79CB\u64AD\u51AC\u79CD", "\u65BD\u8D8A\u51AC\u80A5"];
  return ["\u51AC\u5B63\u7BA1\u62A4", "\u68C0\u4FEE\u8BBE\u5907", "\u79EF\u80A5\u5907\u8015", "\u6E29\u5BA4\u7BA1\u7406"];
}

function getProverb(): string {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "\u6E05\u660E\u524D\u540E\uFF0C\u79CD\u74DC\u70B9\u8C46";
  if (m >= 6 && m <= 8) return "\u590F\u81F3\u4E0D\u70ED\uFF0C\u4E94\u8C37\u4E0D\u7ED3";
  if (m >= 9 && m <= 11) return "\u767D\u9732\u65E9\uFF0C\u5BD2\u9732\u8FDF\uFF0C\u79CB\u5206\u79CD\u9EA6\u6B63\u5F53\u65F6";
  return "\u51AC\u96EA\u96EA\u51AC\u5C0F\u5927\u5BD2\uFF0C\u5907\u597D\u6765\u5E74\u4E30\u6536\u7530";
}

function getCropEmoji(name: string): string {
  const map: Record<string, string> = {
    "\u6C34\u7A3B": "\uD83C\uDF3E", "\u7389\u7C73": "\uD83C\uDF3D", "\u5927\u8C46": "\uD83E\uDD68",
    "\u5C0F\u9EA6": "\uD83C\uDF3E", "\u68C9\u82B1": "\uD83C\uDF3F", "\u8336\u53F6": "\uD83C\uDF75",
    "\u6C34\u679C": "\uD83C\uDF49", "\u852C\u83DC": "\uD83E\uDD6C", "\u82B1\u751F": "\uD83E\uDD60",
    "\u7518\u8517": "\uD83C\uDF3F", "\u8C37\u5B50": "\uD83E\uDD6A",
  };
  return map[name] || "\uD83C\uDF31";
}

function getBriefingIcon(type: string): string {
  if (type === "\u653F\u7B56") return "\uD83D\uDCDC";
  if (type === "\u884C\u60C5") return "\uD83D\uDCC8";
  if (type === "\u9884\u8B66") return "\u26A0\uFE0F";
  return "\uD83D\uDCA1";
}

function getBriefingBorderColor(type: string): string {
  if (type === "\u653F\u7B56") return "border-l-blue-500";
  if (type === "\u884C\u60C5") return "border-l-green-500";
  if (type === "\u9884\u8B66") return "border-l-red-500";
  return "border-l-amber-500";
}

function getDailyTip(): string {
  const tips = [
    "\u4ECA\u65E5\u5EFA\u8BAE\uFF1A\u68C0\u67E5\u7530\u95F4\u6392\u6C34\u7CFB\u7EDF\uFF0C\u786E\u4FDD\u96E8\u540E\u4E0D\u79EF\u6C34\u3002",
    "\u519C\u4E8B\u5C0F\u8D34\u58EB\uFF1A\u5F53\u524D\u5B63\u8282\u6CE8\u610F\u9632\u6CBB\u8717\u725B\uFF0C\u53EF\u7528\u751F\u7269\u519C\u836F\u55B7\u6D12\u3002",
    "\u4ECA\u65E5\u63D0\u9192\uFF1A\u9002\u65F6\u8FFD\u65BD\u62D4\u8282\u80A5\uFF0C\u4FC3\u8FDB\u4F5C\u7269\u751F\u957F\u3002",
    "\u79CD\u690D\u5C0F\u77E5\u8BC6\uFF1A\u8F6C\u8F9F\u4F5C\u7269\u53EF\u6709\u6548\u51CF\u5C11\u571F\u58E4\u75C5\u866B\u5BB3\uFF0C\u63D0\u9AD8\u571F\u5730\u80A5\u529B\u3002",
    "\u5E02\u573A\u52A8\u6001\uFF1A\u6709\u673A\u7EFF\u8272\u519C\u4EA7\u54C1\u4EF7\u683C\u6301\u7EED\u8D70\u9AD8\uFF0C\u5EFA\u8BAE\u62D3\u5C55\u7EBF\u4E0A\u6E20\u9053\u3002",
  ];
  const dayIndex = new Date().getDate() % tips.length;
  return tips[dayIndex];
}

/* ==================== 主组件 ==================== */
export default function Home() {
  /* ---------- Tab 状态 ---------- */
  const [activeTab, setActiveTab] = useState(0);

  /* ---------- Tab1 种植规划 ---------- */
  const [step, setStep] = useState(1);
  const [landArea, setLandArea] = useState("");
  const [landType, setLandType] = useState("");
  const [soilType, setSoilType] = useState("");
  const [terrain, setTerrain] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [recommendation, setRecommendation] = useState<CropRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Tab3 生产管理 ---------- */
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "\u68C0\u67E5\u704C\u6E89\u7CFB\u7EDF", done: false, date: getTodayStr(), category: "\u704C\u6E89", priority: "high" },
    { id: 2, text: "\u65BD\u7528\u6709\u673A\u80A5\u6599", done: true, date: getTodayStr(), category: "\u65BD\u80A5", priority: "medium" },
    { id: 3, text: "\u9664\u8349\u4F5C\u4E1A", done: false, date: getTodayStr(), category: "\u9664\u8349", priority: "low" },
    { id: 4, text: "\u55B7\u6D12\u751F\u7269\u519C\u836F", done: false, date: getTodayStr(), category: "\u9664\u866B", priority: "high" },
  ]);
  const [newTask, setNewTask] = useState("");
  const [taskCategory, setTaskCategory] = useState<Task["category"]>("\u5176\u4ED6");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("medium");
  const [growthRecords, setGrowthRecords] = useState<string[]>([]);

  /* ---------- Tab2 市场行情 ---------- */
  const [marketData, setMarketData] = useState<MarketItem[]>([]);
  const [marketFull, setMarketFull] = useState<MarketResponse | null>(null);
  const [selectedCrop, setSelectedCrop] = useState<string>("");

  /* ---------- Tab4 智能助手 ---------- */
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [videoCallActive, setVideoCallActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  /* ---------- Tab5 我的 ---------- */
  const [userName] = useState("\u519C\u573A\u4E3B\u5F20\u4E09");
  const [farmName] = useState("\u7EFF\u6E90\u751F\u6001\u519C\u573A");
  const [showShareToast, setShowShareToast] = useState(false);
  const [aiResponse, setAiResponse] = useState("");

  /* ==================== 图片上传处理 ==================== */
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setImagePreview(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
    };
    reader.readAsDataURL(file);
  }, []);

  /* ==================== GPS & 天气 ==================== */
  const fetchWeather = useCallback(async (lat: number, lon: number) => {
    try {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      setWeather(data);
    } catch {
      setWeather({ temperature: 25, weatherCode: 1, description: "\u591A\u4E91" });
    }
  }, []);

  const handleGetGPS = useCallback(async () => {
    setGpsLoading(true);
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("\u60A8\u7684\u6D4F\u89C8\u5668\u4E0D\u652F\u6301GPS\u5B9A\u4F4D");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        setGpsError("\u5B9A\u4F4D\u5931\u8D25\uFF0C\u4F7F\u7528\u9ED8\u8BA4\u4F4D\u7F6E");
        fetchWeather(30.57, 104.07);
        setGpsLoading(false);
      }
    );
  }, [fetchWeather]);

  /* ==================== 分析 & 推荐 ==================== */
  const handleAnalyze = useCallback(async () => {
    setLoading(true);
    setStep(3);
    try {
      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageBase64 || undefined,
          landType: landType || undefined,
          soilType: soilType || undefined,
          terrain: terrain || undefined,
        }),
      });
      const analyzeData = await analyzeRes.json();
      setAnalysis(analyzeData);

      const recommendRes = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          landInfo: {
            area: parseFloat(landArea) || 10,
            landType: landType || "\u65F1\u5730",
            soilType: soilType || "\u58E4\u571F",
            terrain: terrain || "\u5E73\u539F",
            fertility: analyzeData?.fertility || "\u4E2D\u7B49",
            drainage: analyzeData?.drainage || "\u826F\u597D",
          },
          weatherInfo: {
            avgTemperature: weather?.avgTemperature || weather?.temperature || 25,
            totalPrecipitation: weather?.totalPrecipitation || 800,
            avgSoilMoisture: weather?.avgSoilMoisture || 60,
            season: weather?.season || "\u6625\u5B63",
            suitableCrops: weather?.suitableCrops || [],
          },
          aiAnalysis: analyzeData,
        }),
      });
      const recommendData = await recommendRes.json();
      setRecommendation(recommendData.crops || recommendData.recommendations || []);
      setStep(4);
    } catch {
      setRecommendation([
        { name: "\u6C34\u7A3B", score: 92, profitPerMu: 1200, matchLevel: "strong", reasons: ["\u9002\u5408\u6C34\u7530\u73AF\u5883", "\u5F53\u524D\u5B63\u8282\u9002\u5B9C"] },
        { name: "\u7389\u7C73", score: 85, profitPerMu: 980, matchLevel: "strong", reasons: ["\u9002\u5E94\u6027\u5F3A", "\u5E02\u573A\u9700\u6C42\u5927"] },
        { name: "\u5927\u8C46", score: 78, profitPerMu: 750, matchLevel: "medium", reasons: ["\u571F\u58E4\u6761\u4EF6\u5339\u914D", "\u8F6E\u4F5C\u63A8\u8350"] },
        { name: "\u5C0F\u9EA6", score: 65, profitPerMu: 600, matchLevel: "medium", reasons: ["\u9700\u8003\u8651\u5B63\u8282\u56E0\u7D20"] },
        { name: "\u68C9\u82B1", score: 45, profitPerMu: 500, matchLevel: "weak", reasons: ["\u6C14\u5019\u5339\u914D\u5EA6\u4E00\u822C"] },
      ]);
      setStep(4);
    }
    setLoading(false);
  }, [imageBase64, landType, soilType, terrain, landArea, weather, analysis]);

  /* 一键规划 */
  const handleQuickPlan = useCallback(() => {
    setLandArea("10");
    setLandType("\u6C34\u7530");
    setSoilType("\u58E4\u571F");
    setTerrain("\u5E73\u539F");
    handleGetGPS();
    setTimeout(() => handleAnalyze(), 1500);
  }, [handleGetGPS, handleAnalyze]);

  /* ==================== 任务管理 ==================== */
  const toggleTask = useCallback((id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const addTask = useCallback(() => {
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), text: newTask.trim(), done: false, date: getTodayStr(), category: taskCategory, priority: taskPriority },
    ]);
    setNewTask("");
  }, [newTask, taskCategory, taskPriority]);

  /* ==================== 市场数据 ==================== */
  const fetchMarketData = useCallback(async () => {
    try {
      const res = await fetch("/api/market");
      const data: MarketResponse = await res.json();
      setMarketFull(data);
      if (Array.isArray(data.items) && data.items.length > 0) {
        setMarketData(data.items);
        if (!selectedCrop && data.items.length > 0) {
          setSelectedCrop(data.items[0].name);
        }
      } else if (Array.isArray(data)) {
        setMarketData(data as MarketItem[]);
        if (!selectedCrop && (data as MarketItem[]).length > 0) {
          setSelectedCrop((data as MarketItem[])[0].name);
        }
      } else {
        const fallback: MarketItem[] = [
          { name: "\u6709\u673A\u6C34\u7A3B", price: "2.80\u5143/\u65A4", trend: "up", change: "+3.2%", emoji: "\uD83C\uDF3E", sparkline: [2.5, 2.6, 2.55, 2.7, 2.65, 2.75, 2.8] },
          { name: "\u65B0\u9C9C\u852C\u83DC", price: "3.50\u5143/\u65A4", trend: "up", change: "+1.8%", emoji: "\uD83E\uDD6C", sparkline: [3.2, 3.3, 3.1, 3.4, 3.35, 3.45, 3.5] },
          { name: "\u4F18\u8D28\u8336\u53F6", price: "120\u5143/\u65A4", trend: "stable", change: "0.0%", emoji: "\uD83C\uDF75", sparkline: [118, 120, 119, 121, 120, 120, 120] },
          { name: "\u7389\u7C73", price: "1.45\u5143/\u65A4", trend: "down", change: "-2.1%", emoji: "\uD83C\uDF3D", sparkline: [1.55, 1.52, 1.50, 1.48, 1.47, 1.46, 1.45] },
          { name: "\u5927\u8C46", price: "3.20\u5143/\u65A4", trend: "up", change: "+4.5%", emoji: "\uD83E\uDD68", sparkline: [2.9, 3.0, 2.95, 3.1, 3.05, 3.15, 3.2] },
          { name: "\u5C0F\u9EA6", price: "1.55\u5143/\u65A4", trend: "stable", change: "+0.3%", emoji: "\uD83C\uDF3E", sparkline: [1.53, 1.54, 1.52, 1.55, 1.54, 1.55, 1.55] },
        ];
        setMarketData(fallback);
        if (!selectedCrop) setSelectedCrop(fallback[0].name);
      }
    } catch {
      const fallback: MarketItem[] = [
        { name: "\u6709\u673A\u6C34\u7A3B", price: "2.80\u5143/\u65A4", trend: "up", change: "+3.2%", emoji: "\uD83C\uDF3E", sparkline: [2.5, 2.6, 2.55, 2.7, 2.65, 2.75, 2.8] },
        { name: "\u65B0\u9C9C\u852C\u83DC", price: "3.50\u5143/\u65A4", trend: "up", change: "+1.8%", emoji: "\uD83E\uDD6C", sparkline: [3.2, 3.3, 3.1, 3.4, 3.35, 3.45, 3.5] },
        { name: "\u4F18\u8D28\u8336\u53F6", price: "120\u5143/\u65A4", trend: "stable", change: "0.0%", emoji: "\uD83C\uDF75", sparkline: [118, 120, 119, 121, 120, 120, 120] },
        { name: "\u7389\u7C73", price: "1.45\u5143/\u65A4", trend: "down", change: "-2.1%", emoji: "\uD83C\uDF3D", sparkline: [1.55, 1.52, 1.50, 1.48, 1.47, 1.46, 1.45] },
        { name: "\u5927\u8C46", price: "3.20\u5143/\u65A4", trend: "up", change: "+4.5%", emoji: "\uD83E\uDD68", sparkline: [2.9, 3.0, 2.95, 3.1, 3.05, 3.15, 3.2] },
        { name: "\u5C0F\u9EA6", price: "1.55\u5143/\u65A4", trend: "stable", change: "+0.3%", emoji: "\uD83C\uDF3E", sparkline: [1.53, 1.54, 1.52, 1.55, 1.54, 1.55, 1.55] },
      ];
      setMarketData(fallback);
      if (!selectedCrop) setSelectedCrop(fallback[0].name);
    }
  }, [selectedCrop]);

  useEffect(() => {
    if ((activeTab === 2 || activeTab === 0) && marketData.length === 0) {
      fetchMarketData();
    }
  }, [activeTab, marketData.length, fetchMarketData]);

  /* ==================== 语音助手 ==================== */
  const processVoiceQuery = useCallback((text: string) => {
    let reply = "";
    if (text.includes("\u5929\u6C14")) {
      reply = `\u5F53\u524D\u5929\u6C14\uFF1A${weather?.description || "\u591A\u4E91"}\uFF0C\u6E29\u5EA6 ${weather?.temperature || 25}\u00B0C\uFF0C\u6E7F\u5EA6 ${weather?.humidity || 65}%\u3002\u5EFA\u8BAE\u5173\u6CE8\u8FD1\u671F\u964D\u96E8\u60C5\u51B5\uFF0C\u5408\u7406\u5B89\u6392\u519C\u4E8B\u3002`;
    } else if (text.includes("\u79CD\u4EC0\u4E48") || text.includes("\u63A8\u8350") || text.includes("\u89C4\u5212")) {
      reply = "\u6839\u636E\u60A8\u7684\u571F\u5730\u6761\u4EF6\uFF0C\u63A8\u8350\u79CD\u690D\uFF1A\u6C34\u7A3B\uFF08\u8BC4\u520692\uFF09\u3001\u7389\u7C73\uFF08\u8BC4\u520685\uFF09\u3001\u5927\u8C46\uFF08\u8BC4\u520678\uFF09\u3002\u5EFA\u8BAE\u4F18\u5148\u8003\u8651\u6C34\u7A3B\uFF0C\u5F53\u524D\u5B63\u8282\u548C\u571F\u58E4\u6761\u4EF6\u90FD\u975E\u5E38\u9002\u5408\u3002";
    } else if (text.includes("\u4EF7\u683C") || text.includes("\u884C\u60C5") || text.includes("\u591A\u5C11\u94B1")) {
      reply = "\u4ECA\u65E5\u519C\u4EA7\u54C1\u884C\u60C5\uFF1A\u6709\u673A\u6C34\u7A3B 2.8\u5143/\u65A4\uFF08\u6DA8\uFF09\uFF0C\u65B0\u9C9C\u852C\u83DC 3.5\u5143/\u65A4\uFF08\u6DA8\uFF09\uFF0C\u4F18\u8D28\u8336\u53F6 120\u5143/\u65A4\uFF08\u7A33\uFF09\u3002\u5EFA\u8BAE\u5173\u6CE8\u5E02\u573A\u52A8\u6001\uFF0C\u62E9\u673A\u51FA\u552E\u3002";
    } else if (text.includes("\u75C5\u866B") || text.includes("\u866B\u5BB3") || text.includes("\u75C5\u5BB3")) {
      reply = "\u5F53\u524D\u5B63\u8282\u5E38\u89C1\u75C5\u866B\u5BB3\uFF1A\u7A3B\u98DE\u8671\u3001\u7EB9\u67AF\u75C5\u3001\u87B3\u866B\u3002\u5EFA\u8BAE\uFF1A1. \u4FDD\u6301\u7530\u95F4\u6C34\u4F4D\u7BA1\u7406\uFF1B2. \u5B9A\u671F\u5DE1\u67E5\u53F6\u7247\uFF1B3. \u53D1\u73B0\u5F02\u5E38\u53CA\u65F6\u4F7F\u7528\u751F\u7269\u519C\u836F\u9632\u6CBB\u3002";
    } else {
      reply = `\u6211\u7406\u89E3\u60A8\u7684\u95EE\u9898\u662F\uFF1A\u201C${text}\u201D\u3002\u4F5C\u4E3A\u667A\u519C\u52A9\u624B\uFF0C\u6211\u53EF\u4EE5\u5E2E\u60A8\u67E5\u8BE2\u5929\u6C14\u3001\u63A8\u8350\u4F5C\u7269\u3001\u4E86\u89E3\u4EF7\u683C\u884C\u60C5\u3001\u8BCA\u65AD\u75C5\u866B\u5BB3\u3002\u8BF7\u95EE\u60A8\u60F3\u4E86\u89E3\u54EA\u65B9\u9762\uFF1F`;
    }
    setChatMessages((prev) => [...prev, { role: "ai", text: reply }]);
  }, [weather]);

  const handleVoiceStart = useCallback(() => {
    const win = window as unknown as Record<string, unknown>;
    const SpeechRecognitionCtor = (win.SpeechRecognition || win.webkitSpeechRecognition) as { new (): {
      lang: string;
      interimResults: boolean;
      onstart: () => void;
      onresult: (event: { results: { 0: { 0: { transcript: string } } } }) => void;
      onerror: () => void;
      onend: () => void;
      start: () => void;
    } } | undefined;
    if (!SpeechRecognitionCtor) {
      setChatMessages((prev) => [...prev, { role: "ai", text: "\u60A8\u7684\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u8BED\u97F3\u8BC6\u522B\uFF0C\u8BF7\u4F7F\u7528Chrome\u6D4F\u89C8\u5668\u3002" }]);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setVoiceText(text);
      setIsListening(false);
      setChatMessages((prev) => [...prev, { role: "user", text }]);
      processVoiceQuery(text);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setChatMessages((prev) => [...prev, { role: "ai", text: "\u8BED\u97F3\u8BC6\u522B\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5\u3002" }]);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [processVoiceQuery]);

  const handleQuickAction = useCallback((action: string) => {
    setChatMessages((prev) => [...prev, { role: "user", text: action }]);
    if (action === "\u67E5\u5929\u6C14") {
      processVoiceQuery("\u5929\u6C14");
    } else if (action === "\u95EE\u4EF7\u683C") {
      processVoiceQuery("\u4EF7\u683C\u884C\u60C5");
    } else if (action === "\u8BCA\u65AD\u75C5\u5BB3") {
      processVoiceQuery("\u75C5\u866B\u5BB3");
    } else if (action === "\u79CD\u690D\u5EFA\u8BAE") {
      processVoiceQuery("\u79CD\u4EC0\u4E48");
    }
  }, [processVoiceQuery]);

  const handleSendChat = useCallback(() => {
    if (!chatInput.trim()) return;
    setChatMessages((prev) => [...prev, { role: "user", text: chatInput.trim() }]);
    processVoiceQuery(chatInput.trim());
    setChatInput("");
  }, [chatInput, processVoiceQuery]);

  /* ==================== 拍照识别 ==================== */
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
      setCapturedFrame(null);
    } catch {
      setChatMessages((prev) => [...prev, { role: "ai", text: "\u65E0\u6CD5\u6253\u5F00\u76F8\u673A\uFF0C\u8BF7\u68C0\u67E5\u6743\u9650\u8BBE\u7F6E\u3002" }]);
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
    stopCamera();
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  const handlePhotoAnalyze = useCallback(() => {
    setChatMessages((prev) => [...prev, { role: "ai", text: "\u6B63\u5728\u8FDB\u884CAI\u56FE\u50CF\u5206\u6790...\n\n\u8BC6\u522B\u7ED3\u679C\uFF1A\u68C0\u6D4B\u5230\u6C34\u7A3B\u4F5C\u7269\uFF0C\u751F\u957F\u9636\u6BB5\u4E3A\u5206\u8568\u671F\u3002\u5065\u5EB7\u72B6\u6001\u826F\u597D\uFF0C\u53F6\u7247\u989C\u8272\u6B63\u5E38\u3002\u5EFA\u8BAE\uFF1A\u4FDD\u63013-5cm\u6D45\u6C34\u5C42\uFF0C\u9002\u65F6\u8FFD\u65BD\u5206\u8568\u80A5\u3002" }]);
  }, []);

  /* ==================== 视频通话 ==================== */
  const handleVideoCall = useCallback(() => {
    setVideoCallActive(true);
    setTimeout(() => {
      setVideoCallActive(false);
      setChatMessages((prev) => [...prev, { role: "ai", text: "\u89C6\u9891\u901A\u8BDD\u5DF2\u7ED3\u675F\u3002\u4E13\u5BB6\u5EFA\u8BAE\uFF1A\u5F53\u524D\u4F5C\u7269\u957F\u52BF\u826F\u597D\uFF0C\u6CE8\u610F\u9632\u6CBB\u7EB9\u67AF\u75C5\uFF0C\u5EFA\u8BAE7\u5929\u540E\u590D\u67E5\u3002" }]);
    }, 5000);
  }, []);

  /* ==================== 聊天滚动 ==================== */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  /* ==================== 清理 ==================== */
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  /* ==================== Tab 标签配置 ==================== */
  const tabs = [
    { icon: "\uD83C\uDFE0", label: "\u9996\u9875" },
    { icon: "\uD83C\uDF3E", label: "\u79CD\u690D" },
    { icon: "\uD83D\uDCCA", label: "\u884C\u60C5" },
    { icon: "\uD83D\uDCCB", label: "\u7BA1\u7406" },
    { icon: "\uD83E\uDD16", label: "\u52A9\u624B" },
    { icon: "\uD83D\uDC64", label: "\u6211\u7684" },
  ];

  const stepLabels = ["\u571F\u5730\u4FE1\u606F", "\u83B7\u53D6\u5929\u6C14", "AI\u5206\u6790", "\u63A8\u8350\u65B9\u6848"];

  /* ==================== SVG 迷你 Sparkline ==================== */
  const renderSparkline = (data: number[], trend: "up" | "down" | "stable"): React.ReactNode => {
    if (!data || data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 60;
    const h = 24;
    const padding = 2;
    const points = data.map((v, i) => {
      const x = padding + (i / (data.length - 1)) * (w - padding * 2);
      const y = h - padding - ((v - min) / range) * (h - padding * 2);
      return `${x},${y}`;
    }).join(" ");
    const color = trend === "up" ? "#ef4444" : trend === "down" ? "#22c55e" : "#9ca3af";
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className="w-16 h-6 flex-shrink-0">
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  };

  /* ==================== SVG 价格走势图 ==================== */
  const renderPriceChart = (): React.ReactNode => {
    const history = marketFull?.history;
    if (!history || history.length < 2) {
      return (
        <div className="flex items-center justify-center h-48 text-stone-400 text-sm">
          \u6682\u65E0\u5386\u53F2\u6570\u636E
        </div>
      );
    }
    const prices = history.map((h) => h.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const range = max - min || 1;
    const chartW = 300;
    const chartH = 150;
    const padLeft = 45;
    const padRight = 10;
    const padTop = 10;
    const padBottom = 25;
    const plotW = chartW - padLeft - padRight;
    const plotH = chartH - padTop - padBottom;

    const toX = (i: number) => padLeft + (i / (history.length - 1)) * plotW;
    const toY = (v: number) => padTop + plotH - ((v - min) / range) * plotH;

    const linePoints = history.map((h, i) => `${toX(i)},${toY(h.price)}`).join(" ");
    const lastPoint = history[history.length - 1];
    const areaPoints = `${padLeft},${padTop + plotH} ${linePoints} ${toX(history.length - 1)},${padTop + plotH}`;

    const ySteps = 4;
    const yLabels: Array<{ val: number; y: number }> = [];
    for (let i = 0; i <= ySteps; i++) {
      const val = min + (range * i) / ySteps;
      yLabels.push({ val, y: toY(val) });
    }

    const xLabels: Array<{ label: string; x: number }> = [];
    const step = Math.max(1, Math.floor(history.length / 6));
    for (let i = 0; i < history.length; i += step) {
      const d = history[i].date;
      const label = d.length >= 5 ? d.slice(5) : d;
      xLabels.push({ label, x: toX(i) });
    }

    const isUp = lastPoint.price >= history[0].price;
    const lineColor = isUp ? "#ef4444" : "#22c55e";

    return (
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" style={{ height: "300px" }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        {yLabels.map((yl, i) => (
          <line key={`grid-${i}`} x1={padLeft} y1={yl.y} x2={chartW - padRight} y2={yl.y} stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="4,4" />
        ))}
        {/* Y-axis labels */}
        {yLabels.map((yl, i) => (
          <text key={`yl-${i}`} x={padLeft - 5} y={yl.y + 3} textAnchor="end" className="text-[8px] fill-stone-400">
            {yl.val.toFixed(1)}
          </text>
        ))}
        {/* X-axis labels */}
        {xLabels.map((xl, i) => (
          <text key={`xl-${i}`} x={xl.x} y={chartH - 5} textAnchor="middle" className="text-[8px] fill-stone-400">
            {xl.label}
          </text>
        ))}
        {/* Area fill */}
        <polygon points={areaPoints} fill="url(#chartGradient)" />
        {/* Price line */}
        <polyline points={linePoints} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {/* Current price dot */}
        <circle cx={toX(history.length - 1)} cy={toY(lastPoint.price)} r="4" fill={lineColor} />
        <circle cx={toX(history.length - 1)} cy={toY(lastPoint.price)} r="7" fill={lineColor} opacity="0.2" />
        {/* Price label on last point */}
        <text x={toX(history.length - 1)} y={toY(lastPoint.price) - 10} textAnchor="end" className="text-[9px] fill-stone-700 font-bold">
          {lastPoint.price.toFixed(2)}
        </text>
      </svg>
    );
  };

  /* ==================== 渲染 ==================== */
  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* ==================== 主内容区 ==================== */}
      <main className="max-w-lg mx-auto px-4 pt-4">

        {/* ==================== Tab 0: 首页 Dashboard ==================== */}
        {activeTab === 0 && (
          <div className="animate-fade-in space-y-4">
            {/* Hero Banner */}
            <div className="bg-gradient-to-br from-green-600 via-green-500 to-emerald-500 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-2 right-2 text-6xl opacity-20 animate-float select-none">
                {getWeatherEmoji(weather?.weatherCode)}
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10">
                <p className="text-sm opacity-90">{getGreeting()}\uFF0C{userName}</p>
                <p className="text-2xl font-bold mt-1">\u667A\u519C\u89C4\u5212\u52A9\u624B</p>
                <div className="flex items-center gap-3 mt-3 bg-white/15 rounded-xl px-4 py-2.5 backdrop-blur-sm">
                  <span className="text-3xl animate-float">{getWeatherEmoji(weather?.weatherCode)}</span>
                  <div>
                    <p className="text-lg font-bold">{weather?.temperature || 25}\u00B0C</p>
                    <p className="text-xs opacity-80">{weather?.description || "\u591A\u4E91"} | \u6E7F\u5EA6 {weather?.humidity || 65}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "\u5F00\u59CB\u89C4\u5212", icon: "\uD83C\uDF3E", bg: "bg-green-50 border-green-200 hover:bg-green-100", iconBg: "bg-green-100", action: () => { setActiveTab(1); } },
                { label: "\u5E02\u573A\u884C\u60C5", icon: "\uD83D\uDCC8", bg: "bg-blue-50 border-blue-200 hover:bg-blue-100", iconBg: "bg-blue-100", action: () => { setActiveTab(2); } },
                { label: "\u519C\u4E8B\u4EFB\u52A1", icon: "\uD83D\uDCCB", bg: "bg-amber-50 border-amber-200 hover:bg-amber-100", iconBg: "bg-amber-100", action: () => { setActiveTab(3); } },
                { label: "AI\u52A9\u624B", icon: "\uD83E\uDD16", bg: "bg-purple-50 border-purple-200 hover:bg-purple-100", iconBg: "bg-purple-100", action: () => { setActiveTab(4); } },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`flex items-center gap-3 p-4 rounded-2xl border transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer ${item.bg}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <span className="text-sm font-bold text-stone-700">{item.label}</span>
                </button>
              ))}
            </div>

            {/* Market Ticker */}
            {marketData.length > 0 && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-stone-700">\uD83D\uDCC8 \u5B9E\u65F6\u884C\u60C5</h3>
                  <button onClick={() => setActiveTab(2)} className="text-xs text-green-600 font-medium cursor-pointer">\u67E5\u770B\u8BE6\u60C5 &rsaquo;</button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-1 scrollbar-hide">
                  {marketData.slice(0, 6).map((item, idx) => (
                    <div key={idx} className="flex-shrink-0 flex items-center gap-2 bg-stone-50 rounded-xl px-3 py-2">
                      <span className="text-lg">{item.emoji || getCropEmoji(item.name)}</span>
                      <div>
                        <p className="text-xs font-medium text-stone-700">{item.name}</p>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-stone-800">{item.price}</span>
                          {item.trend === "up" && <span className="text-xs text-red-500 font-bold">\u2191</span>}
                          {item.trend === "down" && <span className="text-xs text-green-500 font-bold">\u2193</span>}
                          {item.trend === "stable" && <span className="text-xs text-stone-400">\u2192</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Today's Tasks Preview */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-stone-700">\uD83D\uDCCB \u4ECA\u65E5\u4EFB\u52A1</h3>
                <button onClick={() => setActiveTab(3)} className="text-xs text-green-600 font-medium cursor-pointer">\u5168\u90E8 &rsaquo;</button>
              </div>
              <div className="space-y-2">
                {tasks.slice(0, 3).map((task) => (
                  <div key={task.id} className={`flex items-center gap-3 p-2.5 rounded-xl border-l-4 transition-all duration-200 ${getPriorityColor(task.priority)} ${task.done ? "bg-stone-50 opacity-60" : "bg-white"}`}>
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer ${task.done ? "bg-green-600 border-green-600" : "border-stone-300"}`}
                    >
                      {task.done && <span className="text-white text-[10px]">{"\u2713"}</span>}
                    </button>
                    <span className={`text-sm flex-1 ${task.done ? "line-through text-stone-400" : "text-stone-700"}`}>{task.text}</span>
                    <span className="text-lg">{getCategoryIcon(task.category)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">\uD83C\uDF21\uFE0F \u5929\u6C14\u4FE1\u606F</h3>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl">{getWeatherEmoji(weather?.weatherCode)}</span>
                  <div>
                    <p className="text-2xl font-bold text-stone-800">{weather?.temperature || 25}\u00B0C</p>
                    <p className="text-xs text-stone-500">{weather?.description || "\u591A\u4E91"}</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-xs text-stone-500">\uD83D\uDCA7 \u6E7F\u5EA6 {weather?.humidity || 65}%</p>
                  <p className="text-xs text-stone-500">\uD83D\uDCA8 \u98CE\u901F {weather?.windSpeed || 3}m/s</p>
                  {weather?.soilMoisture && <p className="text-xs text-stone-500">\uD83C\uDF31 \u571F\u58E4\u6E7F\u5EA6 {weather.soilMoisture}%</p>}
                </div>
              </div>
            </div>

            {/* AI Insight Card */}
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-4 border border-amber-200 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-xl flex-shrink-0">
                  \uD83D\uDCA1
                </div>
                <div>
                  <p className="text-sm font-bold text-amber-800">\u4ECA\u65E5\u519C\u4E8B\u5C0F\u8D34\u58EB</p>
                  <p className="text-xs text-amber-700 mt-1 leading-relaxed">{getDailyTip()}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================== Tab 1: 种植规划 ==================== */}
        {activeTab === 1 && (
          <div className="animate-fade-in space-y-4">
            {/* 一键规划按钮 */}
            {step === 1 && (
              <button
                onClick={handleQuickPlan}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span className="text-lg">{"\u2728"}</span> \u4E00\u952E\u89C4\u5212
              </button>
            )}

            {/* 步骤指示器 */}
            <div className="flex items-center gap-0 mb-2 px-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step > s ? "bg-green-600 text-white shadow-sm" :
                      step === s ? "bg-green-500 text-white shadow-md animate-pulse-slow ring-4 ring-green-100" :
                      "bg-stone-200 text-stone-500"
                    }`}>
                      {step > s ? "\u2713" : s}
                    </div>
                    <span className={`text-[10px] mt-1 transition-colors duration-200 ${step >= s ? "text-green-600 font-medium" : "text-stone-400"}`}>
                      {stepLabels[s - 1]}
                    </span>
                  </div>
                  {s < 4 && (
                    <div className={`flex-1 h-0.5 mx-1 rounded transition-all duration-500 ${step > s ? "bg-green-500" : "bg-stone-200"}`} />
                  )}
                </div>
              ))}
            </div>

            {/* 步骤1: 土地信息 */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-base font-bold text-stone-700">\u586B\u5199\u571F\u5730\u4FE1\u606F</h2>

                {/* 面积输入 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-2">
                    \u571F\u5730\u9762\u79EF <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{"\uD83C\uDFED"}</span>
                    <input
                      type="number"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      placeholder="\u8BF7\u8F93\u5165\u9762\u79EF"
                      className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                    <span className="text-sm text-stone-500 font-medium">\u4EA9</span>
                  </div>
                </div>

                {/* 拍照上传 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-2">\u62CD\u7167\u4E0A\u4F20\uFF08\u53EF\u9009\uFF09</label>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                  {imagePreview ? (
                    <div className="relative group">
                      <img src={imagePreview} alt="\u571F\u5730\u7167\u7247" className="w-full h-44 object-cover rounded-xl" />
                      <button
                        onClick={() => { setImagePreview(null); setImageBase64(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white text-xs px-3 py-1 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                      >
                        \u91CD\u65B0\u62CD\u7167
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-10 border-2 border-dashed border-stone-300 rounded-xl text-stone-400 text-sm hover:border-green-400 hover:text-green-600 hover:bg-green-50/50 transition-all duration-200 cursor-pointer"
                    >
                      <span className="text-2xl block mb-1">{"\uD83D\uDCF7"}</span>
                      \u70B9\u51FB\u62CD\u7167\u6216\u4E0A\u4F20\u571F\u5730\u7167\u7247
                    </button>
                  )}
                </div>

                {/* 土地类型 - 图标卡片 3x2 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-3">\u571F\u5730\u7C7B\u578B</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["\u6C34\u7530", "\u65F1\u5730", "\u679C\u56ED", "\u83DC\u5730", "\u8336\u56ED", "\u8352\u5730"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setLandType(landType === t ? "" : t)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 hover:shadow-sm cursor-pointer ${
                          landType === t
                            ? "bg-green-50 border-green-500 text-green-700 shadow-sm"
                            : "bg-white border-stone-200 text-stone-600 hover:border-green-300"
                        }`}
                      >
                        <span className="text-2xl">{getLandIcon(t)}</span>
                        <span className="text-xs font-medium">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 土壤类型 - 图标卡片 3x2 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-3">\u571F\u58E4\u7C7B\u578B</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["\u58E4\u571F", "\u9ECF\u571F", "\u7802\u571F", "\u9ED1\u571F", "\u7EA2\u58E4", "\u9EC4\u571F"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSoilType(soilType === t ? "" : t)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 hover:shadow-sm cursor-pointer ${
                          soilType === t
                            ? "bg-green-50 border-green-500 text-green-700 shadow-sm"
                            : "bg-white border-stone-200 text-stone-600 hover:border-green-300"
                        }`}
                      >
                        <span className="text-2xl">{getSoilIcon(t)}</span>
                        <span className="text-xs font-medium">{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 地形 1x4 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-3">\u5730\u5F62</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["\u5E73\u539F", "\u4E18\u9675", "\u5C71\u5730", "\u5761\u5730"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTerrain(terrain === t ? "" : t)}
                        className={`py-2.5 px-3 rounded-xl text-sm border-2 font-medium transition-all duration-200 cursor-pointer ${
                          terrain === t
                            ? "bg-green-600 text-white border-green-600 shadow-sm"
                            : "bg-white text-stone-600 border-stone-200 hover:border-green-400"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => { if (landArea.trim()) setStep(2); }}
                  disabled={!landArea.trim()}
                  className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-sm disabled:bg-stone-300 disabled:text-stone-500 transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer"
                >
                  \u4E0B\u4E00\u6B65\uFF1A\u83B7\u53D6\u5929\u6C14
                </button>
              </div>
            )}

            {/* 步骤2: GPS & 天气 */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-base font-bold text-stone-700">\u83B7\u53D6\u5B9A\u4F4D\u4E0E\u5929\u6C14</h2>
                <p className="text-sm text-stone-500">\u9700\u8981\u83B7\u53D6\u60A8\u7684GPS\u5B9A\u4F4D\u6765\u67E5\u8BE2\u5F53\u5730\u5929\u6C14\u4FE1\u606F</p>

                <button
                  onClick={handleGetGPS}
                  disabled={gpsLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-sm disabled:from-blue-300 disabled:to-blue-300 transition-all duration-200 shadow-md relative overflow-hidden cursor-pointer"
                >
                  {gpsLoading && (
                    <span className="absolute inset-0 animate-ripple bg-blue-400/30 rounded-2xl" />
                  )}
                  <span className="relative z-10">{gpsLoading ? "\u23F3 \u5B9A\u4F4D\u4E2D..." : "\uD83D\uDCCD \u83B7\u53D6GPS\u5B9A\u4F4D"}</span>
                </button>

                {gpsError && <p className="text-xs text-amber-600 text-center">{gpsError}</p>}

                {weather && (
                  <div className="bg-gradient-to-br from-blue-500 to-sky-400 rounded-2xl p-5 text-white shadow-md animate-fade-in">
                    <h3 className="text-sm font-bold mb-3 opacity-90">\u5F53\u524D\u5929\u6C14</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-5xl animate-float">{getWeatherEmoji(weather.weatherCode)}</span>
                        <div>
                          <p className="text-3xl font-bold">{weather.temperature}\u00B0C</p>
                          <p className="text-sm opacity-80">{weather.description}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs space-y-1 opacity-80">
                        <p>{"\uD83D\uDCA7"} \u6E7F\u5EA6 {weather.humidity}%</p>
                        <p>{"\uD83D\uDCA8"} \u98CE\u901F {weather.windSpeed}m/s</p>
                      </div>
                    </div>
                    {weather.soilMoisture && (
                      <div className="mt-3 bg-white/15 rounded-xl px-3 py-2 text-xs">
                        <p>{"\uD83C\uDF31"} \u571F\u58E4\u6E7F\u5EA6 {weather.soilMoisture}% {weather.soilTemperature ? `| \u571F\u58E4\u6E29\u5EA6 ${weather.soilTemperature}\u00B0C` : ""}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 bg-stone-200 text-stone-600 rounded-2xl font-medium text-sm transition-all duration-200 cursor-pointer"
                  >
                    \u4E0A\u4E00\u6B65
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex-1 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-sm disabled:from-green-300 disabled:to-emerald-300 transition-all duration-200 shadow-md cursor-pointer"
                  >
                    \u5F00\u59CBAI\u5206\u6790
                  </button>
                </div>
              </div>
            )}

            {/* 步骤3: 加载中 */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="w-20 h-20 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-6" />
                <p className="text-base font-bold text-stone-700">AI\u6B63\u5728\u5206\u6790\u4E2D...</p>
                <p className="text-xs text-stone-400 mt-2">\u6B63\u5728\u7ED3\u5408\u571F\u5730\u4FE1\u606F\u4E0E\u5929\u6C14\u6570\u636E\u751F\u6210\u63A8\u8350\u65B9\u6848</p>
                <div className="mt-6 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow" style={{ animationDelay: `${i * 0.3}s` }} />
                  ))}
                </div>
              </div>
            )}

            {/* 步骤4: 推荐结果 */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-stone-700">\u63A8\u8350\u79CD\u690D\u65B9\u6848</h2>
                  <div className="flex gap-2">
                    <button onClick={() => setStep(1)} className="text-xs text-green-600 font-medium hover:underline transition-all cursor-pointer">
                      {"\uD83D\uDD04"} \u91CD\u65B0\u89C4\u5212
                    </button>
                  </div>
                </div>

                {/* 土地摘要 */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><span className="text-stone-500">\u9762\u79EF\uFF1A</span><span className="font-medium">{landArea}\u4EA9</span></p>
                    <p><span className="text-stone-500">\u7C7B\u578B\uFF1A</span><span className="font-medium">{landType || "\u672A\u9009\u62E9"}</span></p>
                    <p><span className="text-stone-500">\u571F\u58E4\uFF1A</span><span className="font-medium">{soilType || "\u672A\u9009\u62E9"}</span></p>
                    <p><span className="text-stone-500">\u5730\u5F62\uFF1A</span><span className="font-medium">{terrain || "\u672A\u9009\u62E9"}</span></p>
                  </div>
                </div>

                {/* 推荐列表 - Top 3 特殊卡片 */}
                <div className="space-y-3">
                  {recommendation.map((crop, idx) => {
                    const isTop3 = idx < 3;
                    const medalBg = idx === 0
                      ? "bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-300"
                      : idx === 1
                      ? "bg-gradient-to-r from-stone-50 to-gray-50 border-stone-300"
                      : idx === 2
                      ? "bg-gradient-to-r from-orange-50 to-amber-50 border-orange-300"
                      : "";
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl p-4 border-2 ${isTop3 ? medalBg : getMatchStyle(crop.matchLevel)} animate-fade-in-up`}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getCropEmoji(crop.name)}</span>
                            <span className="text-xl font-bold">{idx === 0 ? "\uD83E\uDD47" : idx === 1 ? "\uD83E\uDD48" : idx === 2 ? "\uD83E\uDD49" : `${idx + 1}.`}</span>
                            <span className="font-bold text-base">{crop.name}</span>
                          </div>
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            isTop3 ? "bg-white/70 text-stone-700" : "bg-white/60"
                          }`}>
                            {getMatchLabel(crop.matchLevel)}
                          </span>
                        </div>
                        {/* 评分进度条 */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="font-bold text-green-700">\u8BC4\u5206 {crop.score}\u5206</span>
                            <span className="text-stone-600">\u4EA9\u5229\u6DA6 {"\u00A5"}{crop.profitPerMu}</span>
                          </div>
                          <div className="w-full h-2.5 bg-white/60 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${
                                crop.score >= 80 ? "bg-gradient-to-r from-green-400 to-green-600" : crop.score >= 60 ? "bg-gradient-to-r from-yellow-400 to-amber-500" : "bg-gradient-to-r from-stone-300 to-stone-400"
                              }`}
                              style={{ width: `${crop.score}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {crop.reasons.map((r, ri) => (
                            <span key={ri} className="text-xs bg-white/50 px-2 py-0.5 rounded-full">{r}</span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 预估收益 */}
                {recommendation.length > 0 && landArea && (
                  <div className="bg-white rounded-2xl p-5 shadow-md border border-stone-100">
                    <h3 className="text-sm font-bold text-stone-700 mb-2">\u9884\u4F30\u6536\u76CA\uFF08\u63A8\u8350TOP1\uFF09</h3>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-green-600">
                        {"\u00A5"}{(recommendation[0].profitPerMu * parseFloat(landArea)).toLocaleString()}
                      </span>
                      <span className="text-sm text-stone-500 mb-1">\u5143/\u5B63</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">\u57FA\u4E8E{landArea}\u4EA9{recommendation[0].name}\u8BA1\u7B97</p>
                    <button onClick={() => { setAiResponse(`\u6536\u76CA\u5206\u6790\u62A5\u544A\n\n\u63A8\u8350\u4F5C\u7269\uFF1A${recommendation[0].name}\n\u79CD\u690D\u9762\u79EF\uFF1A${landArea}\u4EA9\n\u9884\u4F30\u4EA9\u4EA7\uFF1A${recommendation[0].profitPerMu}\u5143/\u4EA9\n\u9884\u4F30\u603B\u6536\u5165\uFF1A\u00A5${(recommendation[0].profitPerMu * parseFloat(landArea)).toLocaleString()}/\u5B63\n\n\u98CE\u9669\u63D0\u793A\uFF1A\u5B9E\u9645\u6536\u76CA\u53D7\u5929\u6C14\u3001\u5E02\u573A\u4EF7\u683C\u6CE2\u52A8\u7B49\u56E0\u7D20\u5F71\u54CD\uFF0C\u5EFA\u8BAE\u5173\u6CE8\u5E02\u573A\u52A8\u6001\u3002`); setActiveTab(4); }} className="mt-3 text-xs text-green-600 font-medium hover:text-green-700 cursor-pointer">
                      {"\uD83D\uDCCA"} \u67E5\u770B\u8BE6\u7EC6\u5206\u6790 {"\u203A"}
                    </button>
                  </div>
                )}

                {/* 分享方案按钮 */}
                <button onClick={() => { setShowShareToast(true); setTimeout(() => setShowShareToast(false), 2000); }} className="w-full py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 cursor-pointer">
                  {"\uD83D\uDCE4"} \u5206\u4EAB\u65B9\u6848
                </button>
                {showShareToast && (
                  <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-2xl shadow-lg z-[100] animate-fade-in text-sm font-medium">
                    {"\u2705"} \u65B9\u6848\u94FE\u63A5\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== Tab 2: 市场行情 ==================== */}
        {activeTab === 2 && (
          <div className="animate-fade-in space-y-4">
            {/* Market Index Banner */}
            <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl p-5 text-white shadow-md">
              <p className="text-xs opacity-80 font-medium">\uD83D\uDCC8 \u519C\u4EA7\u54C1\u7EFC\u5408\u6307\u6570</p>
              <div className="flex items-end gap-3 mt-2">
                <span className="text-3xl font-bold">{marketFull?.index ?? 1024.68}</span>
                <span className={`text-sm font-bold pb-1 ${(marketFull?.indexChange ?? "+1.2%").startsWith("+") ? "text-red-200" : (marketFull?.indexChange ?? "+1.2%").startsWith("-") ? "text-green-200" : "text-white/60"}`}>
                  {(marketFull?.indexChange ?? "+1.2%").startsWith("+") ? "\u2191" : (marketFull?.indexChange ?? "+1.2%").startsWith("-") ? "\u2193" : "\u2192"} {marketFull?.indexChange ?? "+1.2%"}
                </span>
              </div>
              <p className="text-[10px] opacity-60 mt-1">\u66F4\u65B0\u4E8E {getTodayStr()}</p>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 text-center">
                <p className="text-xl font-bold text-red-500">{marketFull?.upCount ?? 4}</p>
                <p className="text-[10px] text-stone-500 mt-0.5">\u6DA8 {"\u2191"}</p>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 text-center">
                <p className="text-xl font-bold text-green-500">{marketFull?.downCount ?? 1}</p>
                <p className="text-[10px] text-stone-500 mt-0.5">\u8DCC {"\u2193"}</p>
              </div>
              <div className="bg-white rounded-2xl p-3 shadow-sm border border-stone-100 text-center">
                <p className="text-xl font-bold text-stone-400">{marketFull?.stableCount ?? 1}</p>
                <p className="text-[10px] text-stone-500 mt-0.5">\u5E73 {"\u2192"}</p>
              </div>
            </div>
            <p className="text-[10px] text-stone-400 text-center -mt-1">{"\uD83D\uDCCA"} \u6570\u636E\u6BCF\u65E5\u66F4\u65B0\uFF0C\u4EC5\u4F9B\u53C2\u8003</p>

            {/* Price Table */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">\uD83D\uDCB0 \u4EF7\u683C\u8868</h3>
              <div className="space-y-2">
                {marketData.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl">
                    <span className="text-xl flex-shrink-0">{item.emoji || getCropEmoji(item.name)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-stone-700">{item.name}</p>
                      <p className="text-lg font-bold text-stone-800">{item.price}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {item.change && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                          item.trend === "up" ? "bg-red-50 text-red-600" : item.trend === "down" ? "bg-green-50 text-green-600" : "bg-stone-100 text-stone-500"
                        }`}>
                          {item.change}
                        </span>
                      )}
                      {renderSparkline(item.sparkline || [], item.trend)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SVG Line Chart Section */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">\uD83D\uDCC8 \u4EF7\u683C\u8D70\u52BF\u56FE</h3>
              {/* Crop selector chips */}
              <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
                {marketData.map((item) => (
                  <button
                    key={item.name}
                    onClick={() => setSelectedCrop(item.name)}
                    className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer ${
                      selectedCrop === item.name
                        ? "bg-green-600 text-white shadow-sm"
                        : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                    }`}
                  >
                    {item.emoji || getCropEmoji(item.name)} {item.name}
                  </button>
                ))}
              </div>
              {/* SVG Chart */}
              <div className="bg-stone-50 rounded-xl p-2">
                {renderPriceChart()}
              </div>
              <p className="text-[10px] text-stone-400 text-center mt-2">{selectedCrop} - \u8FD130\u5929\u4EF7\u683C\u8D70\u52BF</p>
            </div>

            {/* Real-time Briefings */}
            {(marketFull?.briefings && marketFull.briefings.length > 0) && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                <h3 className="text-sm font-bold text-stone-700 mb-3">\uD83D\uDCF0 \u5B9E\u65F6\u7B80\u62A5</h3>
                <div className="space-y-2">
                  {marketFull.briefings.map((b, idx) => (
                    <div key={idx} className={`p-3 rounded-xl bg-stone-50 border-l-4 ${getBriefingBorderColor(b.type)}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span>{getBriefingIcon(b.type)}</span>
                        <span className="text-xs font-bold text-stone-700">{b.title}</span>
                        <span className="text-[10px] text-stone-400 ml-auto">{b.time}</span>
                      </div>
                      <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">{b.content}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Macro Data Section */}
            {marketFull?.macro && (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                <h3 className="text-sm font-bold text-stone-700 mb-3">\uD83D\uDCCA \u5B8F\u89C2\u6570\u636E</h3>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-stone-500">\u79CD\u690D\u9762\u79EF</p>
                    <p className="text-sm font-bold text-green-700 mt-1">{marketFull.macro.plantingArea || "1.2\u4EBF\u4EA9"}</p>
                  </div>
                  <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-stone-500">\u4F9B\u9700\u6BD4</p>
                    <p className="text-sm font-bold text-blue-700 mt-1">{marketFull.macro.supplyDemandRatio || "1.05"}</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-[10px] text-stone-500">\u5B63\u8282\u9884\u6D4B</p>
                    <p className="text-sm font-bold text-amber-700 mt-1">{marketFull.macro.seasonForecast || "\u504F\u5F3A"}</p>
                  </div>
                </div>
                <p className="text-[10px] text-stone-400 text-center -mt-1">{"\uD83D\uDCCB"} \u6570\u636E\u6765\u6E90\uFF1A\u519C\u4E1A\u519C\u6751\u90E8</p>
                {marketFull.macro.policyInfo && (
                  <div className="bg-stone-50 rounded-xl p-3 flex items-start gap-2">
                    <span className="text-lg">{"\uD83D\uDCDB"}</span>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-stone-700">\u653F\u7B56\u4FE1\u606F</p>
                      <p className="text-xs text-stone-500 mt-0.5">{marketFull.macro.policyInfo}</p>
                    </div>
                    <button onClick={() => { setAiResponse("\u6B63\u5728\u83B7\u53D6\u6700\u65B0\u653F\u7B56\u8BE6\u60C5...\n\n" + (marketFull.macro?.policyInfo || "")); setActiveTab(4); }} className="text-xs text-green-600 font-medium flex-shrink-0 hover:text-green-700 cursor-pointer">\u8BE6\u60C5 {"\u203A"}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== Tab 3: 生产管理 ==================== */}
        {activeTab === 3 && (
          <div className="animate-fade-in space-y-4">
            {/* Weather Banner with proverb */}
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-sky-500 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-80 font-medium">\u4ECA\u65E5\u5929\u6C14\u5FEB\u62A5</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-4xl">{getWeatherEmoji(weather?.weatherCode)}</span>
                    <div>
                      <p className="text-2xl font-bold">{weather?.temperature || 25}\u00B0C</p>
                      <p className="text-xs opacity-80">{weather?.description || "\u591A\u4E91"}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs space-y-1 opacity-80">
                  <p>{"\uD83D\uDCA7"} \u6E7F\u5EA6 {weather?.humidity || 65}%</p>
                  <p>{"\uD83D\uDCA8"} \u98CE\u901F {weather?.windSpeed || 3}m/s</p>
                </div>
              </div>
              <p className="text-xs mt-3 opacity-90 bg-white/15 rounded-xl px-3 py-2 backdrop-blur-sm">
                {"\uD83D\uDCA1"} {getProverb()}
              </p>
            </div>

            {/* Farming Calendar */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">{"\uD83D\uDCC5"} \u519C\u4E8B\u65E5\u5386</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-green-600">{new Date().getFullYear()}\u5E74{new Date().getMonth() + 1}\u6708</span>
                <span className="text-xs text-stone-400">\u672C\u6708\u63A8\u8350\u519C\u4E8B</span>
              </div>
              {/* Simple calendar grid */}
              <div className="mb-3">
                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                  {["\u65E5", "\u4E00", "\u4E8C", "\u4E09", "\u56DB", "\u4E94", "\u516D"].map((d) => (
                    <span key={d} className="text-[10px] text-stone-400 font-medium py-1">{d}</span>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: 35 }, (_, i) => {
                    const day = i - new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() + 1;
                    const isValid = day > 0 && day <= new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                    const isToday = isValid && day === new Date().getDate();
                    const hasActivity = isValid && [3, 7, 12, 18, 22, 27].includes(day);
                    return (
                      <div key={i} className={`py-1.5 text-[10px] relative ${!isValid ? "" : isToday ? "bg-green-600 text-white rounded-lg font-bold" : "text-stone-600"}`}>
                        {isValid ? day : ""}
                        {hasActivity && !isToday && <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {getMonthActivities().map((act, i) => (
                  <span key={i} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 font-medium">
                    {act}
                  </span>
                ))}
              </div>
            </div>

            {/* Task List */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">{"\uD83D\uDCDD"} \u519C\u4E8B\u4EFB\u52A1</h3>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border-l-4 transition-all duration-200 ${getPriorityColor(task.priority)} ${
                      task.done ? "bg-stone-50 opacity-60" : "bg-white hover:shadow-sm"
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 cursor-pointer ${
                        task.done ? "bg-green-600 border-green-600" : "border-stone-300 hover:border-green-400"
                      }`}
                    >
                      {task.done && <span className="text-white text-xs">{"\u2713"}</span>}
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className={`text-sm block ${task.done ? "line-through text-stone-400" : "text-stone-700"}`}>
                        {task.text}
                      </span>
                      <span className="text-[10px] text-stone-400">{getCategoryIcon(task.category)} {task.category} | {task.date}</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Add Task */}
              <div className="mt-3 space-y-2">
                {/* Category chips */}
                <div className="flex gap-1.5 overflow-x-auto scrollbar-hide pb-1">
                  {(["\u65BD\u80A5", "\u704C\u6E89", "\u9664\u866B", "\u9664\u8349", "\u5176\u4ED6"] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setTaskCategory(cat)}
                      className={`flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                        taskCategory === cat ? "bg-green-600 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {getCategoryIcon(cat)} {cat}
                    </button>
                  ))}
                </div>
                {/* Priority buttons */}
                <div className="flex gap-1.5 items-center">
                  <span className="text-[10px] text-stone-400">\u4F18\u5148\u7EA7\uFF1A</span>
                  {(["high", "medium", "low"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setTaskPriority(p)}
                      className={`text-[10px] px-2.5 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                        taskPriority === p
                          ? p === "high" ? "bg-red-500 text-white" : p === "medium" ? "bg-amber-500 text-white" : "bg-green-500 text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {p === "high" ? "\u7D27\u6025" : p === "medium" ? "\u4E00\u822C" : "\u4F4E"}
                    </button>
                  ))}
                </div>
                {/* Input + Add */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    placeholder="\u6DFB\u52A0\u65B0\u4EFB\u52A1..."
                    className="flex-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  />
                  <button
                    onClick={addTask}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all duration-200 shadow-sm cursor-pointer"
                  >
                    \u6DFB\u52A0
                  </button>
                </div>
              </div>
            </div>

            {/* Growth Records - Horizontal scrolling */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">{"\uD83C\uDF3F"} \u751F\u957F\u8BB0\u5F55</h3>
              {growthRecords.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-6">\u6682\u65E0\u751F\u957F\u8BB0\u5F55\uFF0C\u62CD\u7167\u8BB0\u5F55\u4F5C\u7269\u751F\u957F\u60C5\u51B5</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x scrollbar-hide">
                  {growthRecords.map((rec, idx) => (
                    <div key={idx} className="flex-shrink-0 w-32 snap-start">
                      <img src={rec} alt={`\u8BB0\u5F55${idx + 1}`} className="w-32 h-32 object-cover rounded-xl shadow-sm" />
                      <p className="text-[10px] text-stone-400 mt-1 text-center">\u7B2C{idx + 1}\u5929</p>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-3 py-3 border-2 border-dashed border-green-300 rounded-xl text-green-600 text-sm hover:bg-green-50 transition-all duration-200 cursor-pointer"
              >
                {"\uD83D\uDCF7"} \u62CD\u7167\u8BB0\u5F55\u751F\u957F\u60C5\u51B5
              </button>
            </div>
          </div>
        )}

        {/* ==================== Tab 4: 智能助手 ==================== */}
        {activeTab === 4 && (
          <div className="animate-fade-in space-y-4">
            {/* Quick action buttons */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "\u67E5\u5929\u6C14", icon: "\uD83C\uDF24\uFE0F" },
                { label: "\u95EE\u4EF7\u683C", icon: "\uD83D\uDCB0" },
                { label: "\u8BCA\u65AD\u75C5\u5BB3", icon: "\uD83D\uDC1B" },
                { label: "\u79CD\u690D\u5EFA\u8BAE", icon: "\uD83C\uDF31" },
              ].map((act) => (
                <button
                  key={act.label}
                  onClick={() => handleQuickAction(act.label)}
                  className="flex flex-col items-center gap-1.5 py-3 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md hover:border-green-200 transition-all duration-200 cursor-pointer"
                >
                  <span className="text-xl">{act.icon}</span>
                  <span className="text-[10px] text-stone-600 font-medium">{act.label}</span>
                </button>
              ))}
            </div>

            {/* Chat Interface */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="h-80 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <span className="text-4xl block mb-2">{"\uD83E\uDD16"}</span>
                    <p className="text-sm text-stone-400">\u60A8\u597D\uFF0C\u6211\u662F\u667A\u519C\u52A9\u624B</p>
                    <p className="text-xs text-stone-300 mt-1">\u53EF\u4EE5\u95EE\u6211\u5929\u6C14\u3001\u4EF7\u683C\u3001\u75C5\u866B\u5BB3\u7B49\u95EE\u9898</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-green-600 text-white rounded-br-md"
                        : "bg-stone-100 text-stone-700 rounded-bl-md"
                    }`}>
                      {msg.role === "ai" && <span className="text-xs text-green-600 font-medium block mb-1">{"\uD83E\uDD16"} \u667A\u519C\u52A9\u624B</span>}
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* Input */}
              <div className="border-t border-stone-100 p-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="\u8F93\u5165\u60A8\u7684\u95EE\u9898..."
                  className="flex-1 px-4 py-2.5 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                />
                <button
                  onClick={handleSendChat}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all duration-200 cursor-pointer"
                >
                  \u53D1\u9001
                </button>
              </div>
            </div>

            {/* Voice Button */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">{"\uD83C\uDF99\uFE0F"} \u8BED\u97F3\u52A9\u624B</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVoiceStart}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-200 relative cursor-pointer ${
                    isListening
                      ? "bg-red-500 text-white shadow-lg scale-110"
                      : "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-md hover:shadow-lg"
                  }`}
                >
                  {isListening && (
                    <>
                      <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
                      <span className="absolute inset-2 rounded-full bg-red-400 animate-ping opacity-20" style={{ animationDelay: "0.3s" }} />
                    </>
                  )}
                  <span className="relative z-10">{"\uD83C\uDF99\uFE0F"}</span>
                </button>
                <div className="flex-1">
                  {voiceText ? (
                    <p className="text-sm text-stone-700">&ldquo;{voiceText}&rdquo;</p>
                  ) : (
                    <p className="text-sm text-stone-400">{isListening ? "\u6B63\u5728\u804A\u542C..." : "\u70B9\u51FB\u9EA6\u514B\u98CE\uFF0C\u8BF4\u51FA\u60A8\u7684\u95EE\u9898"}</p>
                  )}
                  <p className="text-[10px] text-stone-300 mt-1">\u652F\u6301\uFF1A\u5929\u6C14 / \u79CD\u4EC0\u4E48 / \u4EF7\u683C / \u75C5\u866B\u5BB3</p>
                </div>
              </div>
            </div>

            {/* Camera Section */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <button
                onClick={() => cameraActive ? stopCamera() : startCamera()}
                className="w-full flex items-center justify-between p-2 -mx-2 rounded-xl hover:bg-stone-50 active:bg-stone-100 transition-all duration-200 cursor-pointer"
              >
                <h3 className="text-sm font-bold text-stone-700">{"\uD83D\uDCF7"} \u62CD\u7167\u8BC6\u522B</h3>
                <span className={`text-xs transition-all duration-200 ${cameraActive ? "text-red-500" : "text-green-600"}`}>
                  {cameraActive ? "\u5173\u95ED" : "\u5C55\u5F00"}
                </span>
              </button>
              {cameraActive && (
                <div className="mt-3 relative rounded-xl overflow-hidden animate-fade-in">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-52 object-cover bg-black" />
                  {/* Viewfinder overlay - 4 green corner brackets */}
                  <div className="absolute inset-6 pointer-events-none">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-green-400 rounded-tl-lg" style={{ borderWidth: "3px 0 0 3px" }} />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-green-400 rounded-tr-lg" style={{ borderWidth: "3px 3px 0 0" }} />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-green-400 rounded-bl-lg" style={{ borderWidth: "0 0 3px 3px" }} />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-green-400 rounded-br-lg" style={{ borderWidth: "0 3px 3px 0" }} />
                  </div>
                  <button
                    onClick={capturePhoto}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl hover:scale-105 transition-transform cursor-pointer"
                  >
                    {"\uD83D\uDCF8"}
                  </button>
                </div>
              )}
              {capturedFrame && (
                <div className="mt-3 animate-fade-in">
                  <img src={capturedFrame} alt="\u62CD\u6444\u7167\u7247" className="w-full h-52 object-cover rounded-xl" />
                  <button
                    onClick={handlePhotoAnalyze}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200 cursor-pointer"
                  >
                    {"\uD83D\uDD0D"} AI\u5206\u6790
                  </button>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Video Call */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">{"\uD83D\uDCF9"} \u8FDC\u7A0B\u4E13\u5BB6\u89C6\u9891</h3>
              {!videoCallActive ? (
                <button
                  onClick={handleVideoCall}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {"\uD83D\uDCDE"} \u547C\u53EB\u519C\u4E1A\u4E13\u5BB6
                </button>
              ) : (
                <div className="text-center py-6 animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl animate-pulse-slow">{"\uD83D\uDCDE"}</span>
                  </div>
                  <p className="text-sm font-bold text-stone-700">\u6B63\u5728\u8FDE\u63A5\u4E13\u5BB6...</p>
                  <p className="text-xs text-stone-400 mt-1">\u9884\u8BA1\u7B49\u5F85\u65F6\u95F4 1-3 \u5206\u949F</p>
                  <button
                    onClick={() => setVideoCallActive(false)}
                    className="mt-4 px-8 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all duration-200 cursor-pointer"
                  >
                    \u6302\u65AD
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== Tab 5: 我的 ==================== */}
        {activeTab === 5 && (
          <div className="animate-fade-in space-y-4">
            {/* Profile Card */}
            <div className="bg-gradient-to-br from-green-600 via-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
              <div className="relative z-10 flex items-center gap-4">
                <div className="w-18 h-18 bg-white/20 rounded-full flex items-center justify-center text-4xl ring-3 ring-white/30" style={{ width: "72px", height: "72px" }}>
                  {"\uD83D\uDC68\u200D\uD83C\uDF3E"}
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold">{userName}</p>
                  <p className="text-sm opacity-80">{farmName}</p>
                  <p className="text-xs opacity-60 mt-1">{"\uD83D\uDCCD"} \u56DB\u5DDD\u7701\u6210\u90FD\u5E02</p>
                </div>
                <button onClick={() => setAiResponse("\u4E2A\u4EBA\u8D44\u6599\u7F16\u8F91\u529F\u80FD\u5373\u5C06\u4E0A\u7EBF\uFF0C\u656C\u8BF7\u671F\u5F85\uFF01")} className="text-xs bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm hover:bg-white/30 active:scale-95 transition-all duration-200 cursor-pointer">
                  \u7F16\u8F91
                </button>
              </div>
              <div className="relative z-10 mt-3 flex items-center gap-2 text-xs opacity-70">
                <span>{"\uD83D\uDCC5"} \u4F1A\u5458\u81EA 2025\u5E74\u4E0A\u7EBF
                </span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-center text-white shadow-sm">
                <span className="text-xl block mb-1">{"\uD83C\uDF31"}</span>
                <p className="text-2xl font-bold">5</p>
                <p className="text-[10px] opacity-80 mt-0.5">\u5730\u5757\u6570</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-center text-white shadow-sm">
                <span className="text-xl block mb-1">{"\uD83D\uDCCB"}</span>
                <p className="text-2xl font-bold">12</p>
                <p className="text-[10px] opacity-80 mt-0.5">\u8BA2\u5355\u6570</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-center text-white shadow-sm">
                <span className="text-xl block mb-1">{"\uD83D\uDCB0"}</span>
                <p className="text-2xl font-bold">3.8w</p>
                <p className="text-[10px] opacity-80 mt-0.5">\u603B\u6536\u5165</p>
              </div>
            </div>

            {/* Menu List */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              {[
                { icon: "\uD83D\uDCE6", label: "\u6211\u7684\u8BA2\u5355", desc: "\u67E5\u770B\u6240\u6709\u9500\u552E\u8BA2\u5355", badge: 2 },
                { icon: "\uD83D\uDCB0", label: "\u6536\u76CA\u62A5\u544A", desc: "\u67E5\u770B\u6536\u652F\u4E0E\u5229\u6DA6\u5206\u6790", badge: 0 },
                { icon: "\uD83D\uDDFA\uFE0F", label: "\u5730\u5757\u7BA1\u7406", desc: "\u7BA1\u7406\u6211\u7684\u6240\u6709\u5730\u5757", badge: 0 },
                { icon: "\uD83D\uDD14", label: "\u6D88\u606F\u901A\u77E5", desc: "\u7CFB\u7EDF\u6D88\u606F\u4E0E\u63D0\u9192", badge: 5 },
                { icon: "\u2699\uFE0F", label: "\u8BBE\u7F6E", desc: "\u8D26\u6237\u4E0E\u5E94\u7528\u8BBE\u7F6E", badge: 0 },
                { icon: "\uD83D\uDCD6", label: "\u5E2E\u52A9\u4E2D\u5FC3", desc: "\u4F7F\u7528\u6307\u5357\u4E0E\u5E38\u89C1\u95EE\u9898", badge: 0 },
                { icon: "\u2139\uFE0F", label: "\u5173\u4E8E\u6211\u4EEC", desc: "\u7248\u672C\u4FE1\u606F\u4E0E\u8054\u7CFB\u65B9\u5F0F", badge: 0 },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const tips: Record<string, string> = {
                      "\u6211\u7684\u8BA2\u5355": "\u60A8\u6709 2 \u7B14\u5F85\u5904\u7406\u8BA2\u5355\uFF0C1 \u7B14\u5DF2\u5B8C\u6210\u8BA2\u5355\u3002",
                      "\u6536\u76CA\u62A5\u544A": "\u672C\u6708\u603B\u6536\u5165 \u00A512,800\uFF0C\u8F83\u4E0A\u6708\u589E\u957F 15%\u3002\u6C34\u7A3B\u8D21\u732E\u6700\u5927\u5360\u6BD4 45%\u3002",
                      "\u5730\u5757\u7BA1\u7406": "\u60A8\u5171\u6709 5 \u5757\u5730\uFF0C\u603B\u9762\u79EF 48 \u4EA9\u3002\u5176\u4E2D 3 \u5757\u6B63\u5728\u79CD\u690D\u4E2D\u3002",
                      "\u6D88\u606F\u901A\u77E5": "\u60A8\u6709 5 \u6761\u672A\u8BFB\u6D88\u606F\uFF1A2\u6761\u4EF7\u683C\u9884\u8B66\u30012\u6761\u7CFB\u7EDF\u901A\u77E5\u30011\u6761\u4E13\u5BB6\u56DE\u590D\u3002",
                      "\u8BBE\u7F6E": "\u8BBE\u7F6E\u9875\u9762\u5373\u5C06\u4E0A\u7EBF\uFF0C\u656C\u8BF7\u671F\u5F85\u3002",
                      "\u5E2E\u52A9\u4E2D\u5FC3": "\u5E38\u89C1\u95EE\u9898\uFF1A\u5982\u4F55\u4F7F\u7528\u79CD\u690D\u89C4\u5212\uFF1F\u5982\u4F55\u67E5\u770B\u5E02\u573A\u884C\u60C5\uFF1F\u5982\u4F55\u8054\u7CFB\u4E13\u5BB6\uFF1F",
                      "\u5173\u4E8E\u6211\u4EEC": "\u667A\u519C\u89C4\u5212 v3.0.0 \u2014 \u8BA9\u6BCF\u4E00\u4F4D\u519C\u6C11\u90FD\u80FD\u79D1\u5B66\u79CD\u690D\u3001\u589E\u6536\u81F4\u5BCC\u3002",
                    };
                    setAiResponse(tips[item.label] || "\u529F\u80FD\u5F00\u53D1\u4E2D...");
                    setActiveTab(4);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 active:bg-stone-100 transition-all duration-200 border-b border-stone-100 last:border-b-0 cursor-pointer"
                >
                  <span className="text-xl w-8 text-center">{item.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-stone-700">{item.label}</p>
                    <p className="text-[10px] text-stone-400">{item.desc}</p>
                  </div>
                  {item.badge > 0 && (
                    <span className="min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                      {item.badge}
                    </span>
                  )}
                  <span className="text-stone-300 text-sm ml-1">&rsaquo;</span>
                </button>
              ))}
            </div>

            {/* About Section */}
            <div className="text-center py-4 space-y-1">
              <p className="text-xs text-stone-400">\u667A\u519C\u89C4\u5212 v3.0.0</p>
              <p className="text-[10px] text-stone-300">&copy; 2026 SmartFarm Team</p>
            </div>
          </div>
        )}
      </main>

      {/* ==================== 底部导航栏 ==================== */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-stone-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 flex flex-col items-center py-2.5 pt-3 transition-all duration-200 relative cursor-pointer ${
                activeTab === idx ? "text-green-600" : "text-stone-400"
              }`}
            >
              {activeTab === idx && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-1 bg-green-500 rounded-b-full" />
              )}
              <span className={`text-xl transition-transform duration-200 ${activeTab === idx ? "scale-110" : ""}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] mt-0.5 ${activeTab === idx ? "font-bold" : "font-normal"}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
