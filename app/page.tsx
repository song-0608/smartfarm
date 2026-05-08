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
}

interface CropRecommendation {
  name: string;
  score: number;
  profitPerMu: number;
  matchLevel: "strong" | "medium" | "weak";
  reasons: string[];
}

interface Task {
  id: number;
  text: string;
  done: boolean;
  date: string;
  category: "施肥" | "灌溉" | "除虫" | "除草" | "其他";
  priority: "high" | "medium" | "low";
}

interface Product {
  id: number;
  name: string;
  quantity: string;
  price: string;
  status: "待售" | "已售" | "运输中";
}

interface Order {
  id: number;
  buyer: string;
  product: string;
  amount: string;
  total: string;
  status: "待确认" | "已确认" | "已完成";
  date: string;
}

interface MarketItem {
  name: string;
  price: string;
  trend: "up" | "down" | "stable";
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

/* ==================== 工具函数 ==================== */
function getWeatherEmoji(code?: number): string {
  if (code === undefined || code === null) return "☀️";
  if (code === 0) return "☀️";
  if (code <= 2) return "⛅";
  if (code === 3) return "☁️";
  if (code >= 45 && code <= 48) return "🌫️";
  if (code >= 51 && code <= 67) return "🌧️";
  if (code >= 71 && code <= 77) return "🌨️";
  if (code >= 80 && code <= 82) return "🌦️";
  if (code >= 95) return "⛈️";
  return "🌤️";
}

function getMatchStyle(level: "strong" | "medium" | "weak"): string {
  if (level === "strong") return "bg-green-50 border-green-300 text-green-800";
  if (level === "medium") return "bg-yellow-50 border-yellow-300 text-yellow-800";
  return "bg-stone-50 border-stone-300 text-stone-600";
}

function getMatchLabel(level: "strong" | "medium" | "weak"): string {
  if (level === "strong") return "高度匹配";
  if (level === "medium") return "中度匹配";
  return "一般匹配";
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "早上好";
  if (h < 18) return "下午好";
  return "晚上好";
}

function getLandIcon(type: string): string {
  const icons: Record<string, string> = { "水田": "🌾", "旱地": "🌽", "果园": "🍇", "菜地": "🥬", "茶园": "🍵", "荒地": "🌱" };
  return icons[type] || "🌿";
}

function getSoilIcon(type: string): string {
  const icons: Record<string, string> = { "壤土": "🧪", "黏土": "🪨", "砂土": "🏜️", "黑土": "⚫", "红壤": "🟠", "黄土": "🟡" };
  return icons[type] || "🌱";
}

function getCategoryIcon(cat: string): string {
  const icons: Record<string, string> = { "施肥": "🧪", "灌溉": "💧", "除虫": "🐛", "除草": "🌿", "其他": "📝" };
  return icons[cat] || "📝";
}

function getPriorityColor(p: string): string {
  if (p === "high") return "border-l-red-500";
  if (p === "medium") return "border-l-amber-500";
  return "border-l-green-500";
}

function getMonthActivities(): string[] {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return ["春耕整地", "播种育苗", "施基肥", "灌溉春水"];
  if (m >= 6 && m <= 8) return ["追肥管理", "病虫害防治", "中耕除草", "排涝抗旱"];
  if (m >= 9 && m <= 11) return ["秋收准备", "采收晾晒", "秋播冬种", "施越冬肥"];
  return ["冬季管护", "检修设备", "积肥备耕", "温室管理"];
}

function getProverb(): string {
  const m = new Date().getMonth() + 1;
  if (m >= 3 && m <= 5) return "清明前后，种瓜点豆";
  if (m >= 6 && m <= 8) return "夏至不热，五谷不结";
  if (m >= 9 && m <= 11) return "白露早，寒露迟，秋分种麦正当时";
  return "冬雪雪冬小大寒，备好来年丰收田";
}

/* ==================== 主组件 ==================== */
export default function Home() {
  /* ---------- Tab 状态 ---------- */
  const [activeTab, setActiveTab] = useState(0);

  /* ---------- Tab0 种植规划 ---------- */
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

  /* ---------- Tab1 生产管理 ---------- */
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "检查灌溉系统", done: false, date: getTodayStr(), category: "灌溉", priority: "high" },
    { id: 2, text: "施用有机肥料", done: true, date: getTodayStr(), category: "施肥", priority: "medium" },
    { id: 3, text: "除草作业", done: false, date: getTodayStr(), category: "除草", priority: "low" },
    { id: 4, text: "喷洒生物农药", done: false, date: getTodayStr(), category: "除虫", priority: "high" },
  ]);
  const [newTask, setNewTask] = useState("");
  const [taskCategory, setTaskCategory] = useState<Task["category"]>("其他");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("medium");
  const [growthRecords, setGrowthRecords] = useState<string[]>([]);

  /* ---------- Tab2 采收销售 ---------- */
  const [products] = useState<Product[]>([
    { id: 1, name: "有机水稻", quantity: "5000斤", price: "2.8元/斤", status: "待售" },
    { id: 2, name: "新鲜蔬菜", quantity: "2000斤", price: "3.5元/斤", status: "已售" },
    { id: 3, name: "优质茶叶", quantity: "300斤", price: "120元/斤", status: "运输中" },
    { id: 4, name: "生态水果", quantity: "800斤", price: "8.0元/斤", status: "待售" },
  ]);
  const [orders] = useState<Order[]>([
    { id: 1, buyer: "张经理", product: "有机水稻", amount: "1000斤", total: "2800元", status: "待确认", date: "2026-05-01" },
    { id: 2, buyer: "李批发", product: "新鲜蔬菜", amount: "500斤", total: "1750元", status: "已完成", date: "2026-04-28" },
    { id: 3, buyer: "王零售", product: "优质茶叶", amount: "50斤", total: "6000元", status: "已确认", date: "2026-05-03" },
  ]);
  const [supplyForm, setSupplyForm] = useState({ name: "", quantity: "", price: "", desc: "" });
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [marketData, setMarketData] = useState<MarketItem[]>([]);

  /* ---------- Tab3 智能助手 ---------- */
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

  /* ---------- Tab4 我的 ---------- */
  const [userName] = useState("农场主张三");
  const [farmName] = useState("绿源生态农场");

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
      setWeather({ temperature: 25, weatherCode: 1, description: "多云" });
    }
  }, []);

  const handleGetGPS = useCallback(async () => {
    setGpsLoading(true);
    setGpsError("");
    if (!navigator.geolocation) {
      setGpsError("您的浏览器不支持GPS定位");
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeather(pos.coords.latitude, pos.coords.longitude);
        setGpsLoading(false);
      },
      () => {
        setGpsError("定位失败，使用默认位置");
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
            landType: landType || "旱地",
            soilType: soilType || "壤土",
            terrain: terrain || "平原",
            fertility: analyzeData?.fertility || "中等",
            drainage: analyzeData?.drainage || "良好",
          },
          weatherInfo: {
            avgTemperature: weather?.avgTemperature || weather?.temperature || 25,
            totalPrecipitation: weather?.totalPrecipitation || 800,
            avgSoilMoisture: weather?.avgSoilMoisture || 60,
            season: weather?.season || "春季",
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
        { name: "水稻", score: 92, profitPerMu: 1200, matchLevel: "strong", reasons: ["适合水田环境", "当前季节适宜"] },
        { name: "玉米", score: 85, profitPerMu: 980, matchLevel: "strong", reasons: ["适应性强", "市场需求大"] },
        { name: "大豆", score: 78, profitPerMu: 750, matchLevel: "medium", reasons: ["土壤条件匹配", "轮作推荐"] },
        { name: "小麦", score: 65, profitPerMu: 600, matchLevel: "medium", reasons: ["需考虑季节因素"] },
        { name: "棉花", score: 45, profitPerMu: 500, matchLevel: "weak", reasons: ["气候匹配度一般"] },
      ]);
      setStep(4);
    }
    setLoading(false);
  }, [imageBase64, landType, soilType, terrain, landArea, weather, analysis]);

  /* 一键规划 */
  const handleQuickPlan = useCallback(() => {
    setLandArea("10");
    setLandType("水田");
    setSoilType("壤土");
    setTerrain("平原");
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
      const data = await res.json();
      if (Array.isArray(data)) {
        setMarketData(data);
      } else if (data && Array.isArray(data.items)) {
        setMarketData(data.items);
      } else {
        setMarketData([
          { name: "有机水稻", price: "2.80元/斤", trend: "up" },
          { name: "新鲜蔬菜", price: "3.50元/斤", trend: "up" },
          { name: "优质茶叶", price: "120元/斤", trend: "stable" },
          { name: "玉米", price: "1.45元/斤", trend: "down" },
          { name: "大豆", price: "3.20元/斤", trend: "up" },
          { name: "小麦", price: "1.55元/斤", trend: "stable" },
        ]);
      }
    } catch {
      setMarketData([
        { name: "有机水稻", price: "2.80元/斤", trend: "up" },
        { name: "新鲜蔬菜", price: "3.50元/斤", trend: "up" },
        { name: "优质茶叶", price: "120元/斤", trend: "stable" },
        { name: "玉米", price: "1.45元/斤", trend: "down" },
        { name: "大豆", price: "3.20元/斤", trend: "up" },
        { name: "小麦", price: "1.55元/斤", trend: "stable" },
      ]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 2 && marketData.length === 0) {
      fetchMarketData();
    }
  }, [activeTab, marketData.length, fetchMarketData]);

  /* ==================== 语音助手 ==================== */
  const processVoiceQuery = useCallback((text: string) => {
    let reply = "";
    if (text.includes("天气")) {
      reply = `当前天气：${weather?.description || "多云"}，温度 ${weather?.temperature || 25}°C，湿度 ${weather?.humidity || 65}%。建议关注近期降雨情况，合理安排农事。`;
    } else if (text.includes("种什么") || text.includes("推荐") || text.includes("规划")) {
      reply = "根据您的土地条件，推荐种植：水稻（评分92）、玉米（评分85）、大豆（评分78）。建议优先考虑水稻，当前季节和土壤条件都非常适合。";
    } else if (text.includes("价格") || text.includes("行情") || text.includes("多少钱")) {
      reply = "今日农产品行情：有机水稻 2.8元/斤（涨），新鲜蔬菜 3.5元/斤（涨），优质茶叶 120元/斤（稳）。建议关注市场动态，择机出售。";
    } else if (text.includes("病虫") || text.includes("虫害") || text.includes("病害")) {
      reply = "当前季节常见病虫害：稻飞虱、纹枯病、螟虫。建议：1. 保持田间水位管理；2. 定期巡查叶片；3. 发现异常及时使用生物农药防治。";
    } else {
      reply = `我理解您的问题是："${text}"。作为智农助手，我可以帮您查询天气、推荐作物、了解价格行情、诊断病虫害。请问您想了解哪方面？`;
    }
    setChatMessages((prev) => [...prev, { role: "ai", text: reply }]);
  }, [weather]);

  const handleVoiceStart = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const win = window as any;
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) {
      setChatMessages((prev) => [...prev, { role: "ai", text: "您的浏览器不支持语音识别，请使用Chrome浏览器。" }]);
      return;
    }
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: { results: { 0: { 0: { transcript: string } } } }) => {
      const text = event.results[0][0].transcript;
      setVoiceText(text);
      setIsListening(false);
      setChatMessages((prev) => [...prev, { role: "user", text }]);
      processVoiceQuery(text);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setChatMessages((prev) => [...prev, { role: "ai", text: "语音识别失败，请重试。" }]);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, [processVoiceQuery]);

  const handleQuickAction = useCallback((action: string) => {
    setChatMessages((prev) => [...prev, { role: "user", text: action }]);
    if (action === "查天气") {
      processVoiceQuery("天气");
    } else if (action === "问价格") {
      processVoiceQuery("价格行情");
    } else if (action === "诊断病害") {
      processVoiceQuery("病虫害");
    } else if (action === "种植建议") {
      processVoiceQuery("种什么");
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
      setChatMessages((prev) => [...prev, { role: "ai", text: "无法打开相机，请检查权限设置。" }]);
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
    setChatMessages((prev) => [...prev, { role: "ai", text: "正在进行AI图像分析...\n\n识别结果：检测到水稻作物，生长阶段为分蘖期。健康状态良好，叶片颜色正常。建议：保持3-5cm浅水层，适时追施分蘖肥。" }]);
  }, []);

  /* ==================== 视频通话 ==================== */
  const handleVideoCall = useCallback(() => {
    setVideoCallActive(true);
    setTimeout(() => {
      setVideoCallActive(false);
      setChatMessages((prev) => [...prev, { role: "ai", text: "视频通话已结束。专家建议：当前作物长势良好，注意防治纹枯病，建议7天后复查。" }]);
    }, 5000);
  }, []);

  /* ==================== 供应信息发布 ==================== */
  const handleSupplySubmit = useCallback(() => {
    setShowSupplyForm(false);
    setSupplyForm({ name: "", quantity: "", price: "", desc: "" });
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
    { icon: "🌾", label: "种植规划" },
    { icon: "📋", label: "生产管理" },
    { icon: "🚜", label: "采收销售" },
    { icon: "🤖", label: "智能助手" },
    { icon: "👤", label: "我的" },
  ];

  const stepLabels = ["土地信息", "获取天气", "AI分析", "推荐方案"];

  /* ==================== 收入数据（CSS柱状图） ==================== */
  const revenueData = [
    { month: "1月", value: 3200 },
    { month: "2月", value: 2800 },
    { month: "3月", value: 4100 },
    { month: "4月", value: 3600 },
    { month: "5月", value: 5200 },
    { month: "6月", value: 4800 },
  ];
  const maxRevenue = Math.max(...revenueData.map((d) => d.value));

  /* ==================== 渲染 ==================== */
  return (
    <div className="min-h-screen bg-stone-50 pb-24">
      {/* ==================== 顶部栏 ==================== */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📍</span>
            <div>
              <p className="text-sm font-bold">{getGreeting()}，{userName}</p>
              <p className="text-[10px] opacity-80">{farmName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs opacity-80">{getTodayStr()}</span>
            <button className="relative">
              <span className="text-lg">🔔</span>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            </button>
          </div>
        </div>
      </header>

      {/* ==================== 主内容区 ==================== */}
      <main className="max-w-lg mx-auto px-4 pt-4">

        {/* ==================== Tab0: 种植规划 ==================== */}
        {activeTab === 0 && (
          <div className="animate-fade-in space-y-4">
            {/* 一键规划按钮 */}
            {step === 1 && (
              <button
                onClick={handleQuickPlan}
                className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <span className="text-lg">✨</span> 一键规划
              </button>
            )}

            {/* 步骤指示器 */}
            <div className="flex items-center gap-0 mb-2 px-2">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                      step >= s ? "bg-green-600 text-white shadow-sm" : "bg-stone-200 text-stone-500"
                    }`}>
                      {step > s ? "✓" : s}
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
                <h2 className="text-base font-bold text-stone-700">填写土地信息</h2>

                {/* 面积输入 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-2">
                    土地面积 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      placeholder="请输入面积"
                      className="flex-1 px-4 py-3 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    />
                    <span className="text-sm text-stone-500 font-medium">亩</span>
                  </div>
                </div>

                {/* 拍照上传 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-2">拍照上传（可选）</label>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                  {imagePreview ? (
                    <div className="relative group">
                      <img src={imagePreview} alt="土地照片" className="w-full h-44 object-cover rounded-xl" />
                      <button
                        onClick={() => { setImagePreview(null); setImageBase64(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white text-xs px-3 py-1 rounded-lg opacity-80 group-hover:opacity-100 transition-opacity"
                      >
                        重新拍照
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-10 border-2 border-dashed border-stone-300 rounded-xl text-stone-400 text-sm hover:border-green-400 hover:text-green-600 hover:bg-green-50/50 transition-all duration-200"
                    >
                      <span className="text-2xl block mb-1">📷</span>
                      点击拍照或上传土地照片
                    </button>
                  )}
                </div>

                {/* 土地类型 - 图标卡片 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-3">土地类型</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["水田", "旱地", "果园", "菜地", "茶园", "荒地"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setLandType(landType === t ? "" : t)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 hover:shadow-sm ${
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

                {/* 土壤类型 - 图标卡片 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-3">土壤类型</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["壤土", "黏土", "砂土", "黑土", "红壤", "黄土"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSoilType(soilType === t ? "" : t)}
                        className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 transition-all duration-200 hover:shadow-sm ${
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

                {/* 地形 */}
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                  <label className="block text-sm font-medium text-stone-600 mb-3">地形</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["平原", "丘陵", "山地", "坡地"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTerrain(terrain === t ? "" : t)}
                        className={`py-2.5 px-3 rounded-xl text-sm border-2 font-medium transition-all duration-200 ${
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
                  className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-sm disabled:bg-stone-300 disabled:text-stone-500 transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  下一步：获取天气
                </button>
              </div>
            )}

            {/* 步骤2: GPS & 天气 */}
            {step === 2 && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-base font-bold text-stone-700">获取定位与天气</h2>
                <p className="text-sm text-stone-500">需要获取您的GPS定位来查询当地天气信息</p>

                <button
                  onClick={handleGetGPS}
                  disabled={gpsLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl font-bold text-sm disabled:from-blue-300 disabled:to-blue-300 transition-all duration-200 shadow-md"
                >
                  {gpsLoading ? "⏳ 定位中..." : "📍 获取GPS定位"}
                </button>

                {gpsError && <p className="text-xs text-amber-600 text-center">{gpsError}</p>}

                {weather && (
                  <div className="bg-gradient-to-br from-blue-500 to-sky-400 rounded-2xl p-5 text-white shadow-md animate-fade-in">
                    <h3 className="text-sm font-bold mb-3 opacity-90">当前天气</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-5xl animate-pulse-slow">{getWeatherEmoji(weather.weatherCode)}</span>
                        <div>
                          <p className="text-3xl font-bold">{weather.temperature}°C</p>
                          <p className="text-sm opacity-80">{weather.description}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs space-y-1 opacity-80">
                        <p>💧 湿度 {weather.humidity}%</p>
                        <p>💨 风速 {weather.windSpeed}m/s</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3.5 bg-stone-200 text-stone-600 rounded-2xl font-medium text-sm transition-all duration-200"
                  >
                    上一步
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex-1 py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-sm disabled:from-green-300 disabled:to-emerald-300 transition-all duration-200 shadow-md"
                  >
                    开始AI分析
                  </button>
                </div>
              </div>
            )}

            {/* 步骤3: 加载中 */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="w-20 h-20 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-6" />
                <p className="text-base font-bold text-stone-700">AI正在分析中...</p>
                <p className="text-xs text-stone-400 mt-2">正在结合土地信息与天气数据生成推荐方案</p>
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
                  <h2 className="text-base font-bold text-stone-700">推荐种植方案</h2>
                  <button onClick={() => setStep(1)} className="text-xs text-green-600 font-medium hover:underline transition-all">
                    重新规划
                  </button>
                </div>

                {/* 土地摘要 */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-4 border border-green-200">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><span className="text-stone-500">面积：</span><span className="font-medium">{landArea}亩</span></p>
                    <p><span className="text-stone-500">类型：</span><span className="font-medium">{landType || "未选择"}</span></p>
                    <p><span className="text-stone-500">土壤：</span><span className="font-medium">{soilType || "未选择"}</span></p>
                    <p><span className="text-stone-500">地形：</span><span className="font-medium">{terrain || "未选择"}</span></p>
                  </div>
                </div>

                {/* 推荐列表 */}
                <div className="space-y-3">
                  {recommendation.map((crop, idx) => {
                    const isTop3 = idx < 3;
                    const medalColors = idx === 0 ? "from-amber-50 to-yellow-50 border-amber-300" : idx === 1 ? "from-stone-50 to-gray-50 border-stone-300" : idx === 2 ? "from-orange-50 to-amber-50 border-orange-300" : "";
                    return (
                      <div
                        key={idx}
                        className={`rounded-2xl p-4 border-2 transition-all duration-200 hover:shadow-md ${
                          isTop3 ? `bg-gradient-to-r ${medalColors}` : getMatchStyle(crop.matchLevel)
                        } animate-fade-in-up`}
                        style={{ animationDelay: `${idx * 0.1}s` }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}</span>
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
                            <span className="font-bold text-green-700">评分 {crop.score}分</span>
                            <span className="text-stone-600">亩利润 ¥{crop.profitPerMu}</span>
                          </div>
                          <div className="w-full h-2 bg-white/60 rounded-full overflow-hidden">
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
                    <h3 className="text-sm font-bold text-stone-700 mb-2">预估收益（推荐TOP1）</h3>
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-bold text-green-600">
                        ¥{(recommendation[0].profitPerMu * parseFloat(landArea)).toLocaleString()}
                      </span>
                      <span className="text-sm text-stone-500 mb-1">/季</span>
                    </div>
                    <p className="text-xs text-stone-400 mt-1">基于{landArea}亩{recommendation[0].name}计算</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ==================== Tab1: 生产管理 ==================== */}
        {activeTab === 1 && (
          <div className="animate-fade-in space-y-4">
            {/* 天气快报 */}
            <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-sky-500 rounded-2xl p-5 text-white shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-80 font-medium">今日天气快报</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-4xl">{getWeatherEmoji(weather?.weatherCode)}</span>
                    <div>
                      <p className="text-2xl font-bold">{weather?.temperature || 25}°C</p>
                      <p className="text-xs opacity-80">{weather?.description || "多云"}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs space-y-1 opacity-80">
                  <p>💧 湿度 {weather?.humidity || 65}%</p>
                  <p>💨 风速 {weather?.windSpeed || 3}m/s</p>
                </div>
              </div>
              <p className="text-xs mt-3 opacity-90 bg-white/15 rounded-xl px-3 py-2 backdrop-blur-sm">
                💡 {getProverb()}
              </p>
            </div>

            {/* 农事日历 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">📅 农事日历</h3>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-medium text-green-600">{new Date().getFullYear()}年{new Date().getMonth() + 1}月</span>
                <span className="text-xs text-stone-400">本月推荐农事</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {getMonthActivities().map((act, i) => (
                  <span key={i} className="text-xs bg-green-50 text-green-700 px-3 py-1.5 rounded-full border border-green-200 font-medium">
                    {act}
                  </span>
                ))}
              </div>
            </div>

            {/* 农事任务 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">📝 今日农事任务</h3>
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
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                        task.done ? "bg-green-600 border-green-600" : "border-stone-300 hover:border-green-400"
                      }`}
                    >
                      {task.done && <span className="text-white text-xs">{"✓"}</span>}
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
              {/* 添加任务 */}
              <div className="mt-3 space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={(e) => setNewTask(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addTask()}
                    placeholder="添加新任务..."
                    className="flex-1 px-3 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  />
                  <button
                    onClick={addTask}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all duration-200 shadow-sm"
                  >
                    添加
                  </button>
                </div>
                <div className="flex gap-2">
                  <div className="flex gap-1.5 flex-1">
                    {(["施肥", "灌溉", "除虫", "除草", "其他"] as const).map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setTaskCategory(cat)}
                        className={`text-[10px] px-2 py-1 rounded-lg transition-all duration-200 ${
                          taskCategory === cat ? "bg-green-600 text-white" : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                        }`}
                      >
                        {getCategoryIcon(cat)} {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <span className="text-[10px] text-stone-400 leading-6">优先级：</span>
                  {(["high", "medium", "low"] as const).map((p) => (
                    <button
                      key={p}
                      onClick={() => setTaskPriority(p)}
                      className={`text-[10px] px-2 py-1 rounded-lg transition-all duration-200 ${
                        taskPriority === p
                          ? p === "high" ? "bg-red-500 text-white" : p === "medium" ? "bg-amber-500 text-white" : "bg-green-500 text-white"
                          : "bg-stone-100 text-stone-500 hover:bg-stone-200"
                      }`}
                    >
                      {p === "high" ? "紧急" : p === "medium" ? "一般" : "低"}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 生长记录 - 横向滚动 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">🌿 生长记录</h3>
              {growthRecords.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-6">暂无生长记录，拍照记录作物生长情况</p>
              ) : (
                <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
                  {growthRecords.map((rec, idx) => (
                    <div key={idx} className="flex-shrink-0 w-32 snap-start">
                      <img src={rec} alt={`记录${idx + 1}`} className="w-32 h-32 object-cover rounded-xl shadow-sm" />
                      <p className="text-[10px] text-stone-400 mt-1 text-center">第{idx + 1}天</p>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-3 py-3 border-2 border-dashed border-green-300 rounded-xl text-green-600 text-sm hover:bg-green-50 transition-all duration-200"
              >
                📷 拍照记录生长情况
              </button>
            </div>
          </div>
        )}

        {/* ==================== Tab2: 采收销售 ==================== */}
        {activeTab === 2 && (
          <div className="animate-fade-in space-y-4">
            {/* 市场价格滚动条 */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-3 shadow-md overflow-hidden">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-white text-xs font-bold">📈 实时行情</span>
              </div>
              <div className="overflow-hidden">
                <div className="flex gap-4 animate-marquee whitespace-nowrap">
                  {[...marketData, ...marketData].map((item, idx) => (
                    <span key={idx} className="text-white text-xs flex items-center gap-1">
                      <span className="font-medium">{item.name}</span>
                      <span>{item.price}</span>
                      <span className={item.trend === "up" ? "text-green-200" : item.trend === "down" ? "text-red-200" : "text-white/60"}>
                        {item.trend === "up" ? "↑" : item.trend === "down" ? "↓" : "→"}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* 收入概览 - CSS柱状图 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">💰 收入概览（近6月）</h3>
              <div className="flex items-end gap-2 h-32">
                {revenueData.map((d) => (
                  <div key={d.month} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[10px] text-stone-500 font-medium">¥{(d.value / 1000).toFixed(1)}k</span>
                    <div className="w-full bg-stone-100 rounded-t-lg overflow-hidden" style={{ height: "100px" }}>
                      <div
                        className="w-full bg-gradient-to-t from-green-500 to-green-400 rounded-t-lg transition-all duration-700"
                        style={{ height: `${(d.value / maxRevenue) * 100}%`, marginTop: `${100 - (d.value / maxRevenue) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-stone-400">{d.month}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 产品列表 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">🛒 我的产品</h3>
              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                        p.status === "待售" ? "bg-amber-100" : p.status === "已售" ? "bg-green-100" : "bg-blue-100"
                      }`}>
                        {p.status === "待售" ? "🌾" : p.status === "已售" ? "✅" : "🚚"}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-stone-700">{p.name}</p>
                        <p className="text-xs text-stone-400">{p.quantity} | {p.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        p.status === "待售" ? "bg-amber-100 text-amber-700" : p.status === "已售" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {p.status}
                      </span>
                      {p.status === "待售" && (
                        <button className="text-xs text-green-600 font-medium hover:underline">上架</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 销售订单 - 时间线 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">📋 销售订单</h3>
              <div className="space-y-0">
                {orders.map((o, idx) => (
                  <div key={o.id} className="flex gap-3">
                    {/* 时间线 */}
                    <div className="flex flex-col items-center">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        o.status === "已完成" ? "bg-green-500" : o.status === "已确认" ? "bg-blue-500" : "bg-amber-500"
                      }`} />
                      {idx < orders.length - 1 && <div className="w-0.5 flex-1 bg-stone-200" />}
                    </div>
                    {/* 内容 */}
                    <div className={`pb-4 flex-1 ${idx === orders.length - 1 ? "pb-0" : ""}`}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium text-stone-700">{o.buyer}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          o.status === "待确认" ? "bg-amber-100 text-amber-700" : o.status === "已确认" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                        }`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500">{o.product} x {o.amount}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-bold text-green-600">{o.total}</span>
                        <span className="text-[10px] text-stone-400">{o.date}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 发布供应信息 */}
            {!showSupplyForm ? (
              <button
                onClick={() => setShowSupplyForm(true)}
                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition-all duration-200"
              >
                📢 发布供应信息
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 space-y-3 animate-fade-in">
                <h3 className="text-sm font-bold text-stone-700">发布供应信息</h3>
                <input
                  type="text"
                  value={supplyForm.name}
                  onChange={(e) => setSupplyForm({ ...supplyForm, name: e.target.value })}
                  placeholder="产品名称"
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={supplyForm.quantity}
                    onChange={(e) => setSupplyForm({ ...supplyForm, quantity: e.target.value })}
                    placeholder="数量（如：5000斤）"
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  />
                  <input
                    type="text"
                    value={supplyForm.price}
                    onChange={(e) => setSupplyForm({ ...supplyForm, price: e.target.value })}
                    placeholder="期望价格"
                    className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                  />
                </div>
                <textarea
                  value={supplyForm.desc}
                  onChange={(e) => setSupplyForm({ ...supplyForm, desc: e.target.value })}
                  placeholder="产品描述（品质、产地等）"
                  rows={3}
                  className="w-full px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none transition-all duration-200"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSupplyForm(false)}
                    className="flex-1 py-2.5 bg-stone-200 text-stone-600 rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSupplySubmit}
                    className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200"
                  >
                    发布
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================== Tab3: 智能助手 ==================== */}
        {activeTab === 3 && (
          <div className="animate-fade-in space-y-4">
            {/* 快捷操作 */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { label: "查天气", icon: "🌤️" },
                { label: "问价格", icon: "💰" },
                { label: "诊断病害", icon: "🐛" },
                { label: "种植建议", icon: "🌱" },
              ].map((act) => (
                <button
                  key={act.label}
                  onClick={() => handleQuickAction(act.label)}
                  className="flex flex-col items-center gap-1 py-3 bg-white rounded-2xl shadow-sm border border-stone-100 hover:shadow-md hover:border-green-200 transition-all duration-200"
                >
                  <span className="text-xl">{act.icon}</span>
                  <span className="text-[10px] text-stone-600 font-medium">{act.label}</span>
                </button>
              ))}
            </div>

            {/* 聊天界面 */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              <div className="h-80 overflow-y-auto p-4 space-y-3">
                {chatMessages.length === 0 && (
                  <div className="text-center py-12">
                    <span className="text-4xl block mb-2">🤖</span>
                    <p className="text-sm text-stone-400">您好，我是智农助手</p>
                    <p className="text-xs text-stone-300 mt-1">可以问我天气、价格、病虫害等问题</p>
                  </div>
                )}
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}>
                    <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-green-600 text-white rounded-br-md"
                        : "bg-stone-100 text-stone-700 rounded-bl-md"
                    }`}>
                      {msg.role === "ai" && <span className="text-xs text-green-600 font-medium block mb-1">🤖 智农助手</span>}
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              {/* 输入框 */}
              <div className="border-t border-stone-100 p-3 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  placeholder="输入您的问题..."
                  className="flex-1 px-4 py-2.5 bg-stone-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200"
                />
                <button
                  onClick={handleSendChat}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition-all duration-200"
                >
                  发送
                </button>
              </div>
            </div>

            {/* 语音助手 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">🎤 语音助手</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleVoiceStart}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-200 relative ${
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
                  <span className="relative z-10">🎤</span>
                </button>
                <div className="flex-1">
                  {voiceText ? (
                    <p className="text-sm text-stone-700">&ldquo;{voiceText}&rdquo;</p>
                  ) : (
                    <p className="text-sm text-stone-400">{isListening ? "正在聆听..." : "点击麦克风，说出您的问题"}</p>
                  )}
                  <p className="text-[10px] text-stone-300 mt-1">支持：天气 / 种什么 / 价格 / 病虫害</p>
                </div>
              </div>
            </div>

            {/* 拍照识别 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">📷 拍照识别</h3>
              {cameraActive && (
                <div className="relative mb-3 rounded-xl overflow-hidden">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-52 object-cover bg-black" />
                  {/* 取景框 */}
                  <div className="absolute inset-4 border-2 border-white/40 rounded-lg pointer-events-none">
                    <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-green-400 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-green-400 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-green-400 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-green-400 rounded-br-lg" />
                  </div>
                  <button
                    onClick={capturePhoto}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 w-14 h-14 bg-white rounded-full shadow-lg flex items-center justify-center text-xl hover:scale-105 transition-transform"
                  >
                    📸
                  </button>
                  <button
                    onClick={stopCamera}
                    className="absolute top-3 right-3 bg-black/50 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-sm"
                  >
                    关闭
                  </button>
                </div>
              )}
              {capturedFrame && (
                <div className="mb-3">
                  <img src={capturedFrame} alt="拍摄照片" className="w-full h-52 object-cover rounded-xl" />
                  <button
                    onClick={handlePhotoAnalyze}
                    className="w-full mt-2 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-sm font-bold shadow-sm transition-all duration-200"
                  >
                    🔍 AI分析
                  </button>
                </div>
              )}
              {!cameraActive && !capturedFrame && (
                <button
                  onClick={startCamera}
                  className="w-full py-8 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 text-sm hover:border-green-400 hover:text-green-600 hover:bg-green-50/50 transition-all duration-200"
                >
                  <span className="text-2xl block mb-1">📷</span>
                  打开相机拍照识别
                </button>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* 远程视频 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">📹 远程专家视频</h3>
              {!videoCallActive ? (
                <button
                  onClick={handleVideoCall}
                  className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-sm hover:shadow-md transition-all duration-200"
                >
                  📞 呼叫农业专家
                </button>
              ) : (
                <div className="text-center py-6 animate-fade-in">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-3xl animate-pulse-slow">📞</span>
                  </div>
                  <p className="text-sm font-bold text-stone-700">正在连接专家...</p>
                  <p className="text-xs text-stone-400 mt-1">预计等待时间 1-3 分钟</p>
                  <button
                    onClick={() => setVideoCallActive(false)}
                    className="mt-4 px-8 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-all duration-200"
                  >
                    挂断
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================== Tab4: 我的 ==================== */}
        {activeTab === 4 && (
          <div className="animate-fade-in space-y-4">
            {/* 用户信息卡片 */}
            <div className="bg-gradient-to-br from-green-600 via-green-600 to-emerald-600 rounded-2xl p-6 text-white shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-18 h-18 bg-white/20 rounded-full flex items-center justify-center text-4xl ring-3 ring-white/30" style={{ width: "72px", height: "72px" }}>
                  👨‍🌾
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold">{userName}</p>
                  <p className="text-sm opacity-80">{farmName}</p>
                  <p className="text-xs opacity-60 mt-1">📍 四川省成都市</p>
                </div>
                <button className="text-xs bg-white/20 px-3 py-1.5 rounded-lg backdrop-blur-sm hover:bg-white/30 transition-all duration-200">
                  编辑
                </button>
              </div>
            </div>

            {/* 数据统计 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-center text-white shadow-sm">
                <span className="text-xl block mb-1">🌱</span>
                <p className="text-2xl font-bold">5</p>
                <p className="text-[10px] opacity-80 mt-0.5">地块数</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-center text-white shadow-sm">
                <span className="text-xl block mb-1">📋</span>
                <p className="text-2xl font-bold">12</p>
                <p className="text-[10px] opacity-80 mt-0.5">订单数</p>
              </div>
              <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-4 text-center text-white shadow-sm">
                <span className="text-xl block mb-1">💰</span>
                <p className="text-2xl font-bold">3.8w</p>
                <p className="text-[10px] opacity-80 mt-0.5">总收入</p>
              </div>
            </div>

            {/* 菜单列表 */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              {[
                { icon: "📦", label: "我的订单", desc: "查看所有销售订单", badge: 2 },
                { icon: "💰", label: "收益报告", desc: "查看收支与利润分析", badge: 0 },
                { icon: "🗺️", label: "地块管理", desc: "管理我的所有地块", badge: 0 },
                { icon: "🔔", label: "消息通知", desc: "系统消息与提醒", badge: 5 },
                { icon: "⚙️", label: "设置", desc: "账户与应用设置", badge: 0 },
                { icon: "📖", label: "帮助中心", desc: "使用指南与常见问题", badge: 0 },
                { icon: "ℹ️", label: "关于我们", desc: "版本信息与联系方式", badge: 0 },
              ].map((item, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 transition-all duration-200 border-b border-stone-100 last:border-b-0"
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

            {/* 版本信息 */}
            <div className="text-center py-4 space-y-1">
              <p className="text-xs text-stone-400">智农规划 v2.0.0</p>
              <p className="text-[10px] text-stone-300">© 2026 SmartFarm Team</p>
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
              className={`flex-1 flex flex-col items-center py-2.5 pt-3 transition-all duration-200 relative ${
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
