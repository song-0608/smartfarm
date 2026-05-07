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

/* ==================== 工具函数 ==================== */
function getWeatherEmoji(code?: number): string {
  if (code === undefined || code === null) return "🌤️";
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
  if (level === "strong") return "bg-green-100 border-green-400 text-green-800";
  if (level === "medium") return "bg-yellow-100 border-yellow-400 text-yellow-800";
  return "bg-gray-100 border-gray-400 text-gray-600";
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
  const [analysis, setAnalysis] = useState<any>(null);
  const [recommendation, setRecommendation] = useState<CropRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ---------- Tab2 生产管理 ---------- */
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: "检查灌溉系统", done: false, date: getTodayStr() },
    { id: 2, text: "施用有机肥料", done: true, date: getTodayStr() },
    { id: 3, text: "除草作业", done: false, date: getTodayStr() },
  ]);
  const [newTask, setNewTask] = useState("");
  const [growthRecords, setGrowthRecords] = useState<string[]>([]);

  /* ---------- Tab3 采收销售 ---------- */
  const [products] = useState<Product[]>([
    { id: 1, name: "有机水稻", quantity: "5000斤", price: "2.8元/斤", status: "待售" },
    { id: 2, name: "新鲜蔬菜", quantity: "2000斤", price: "3.5元/斤", status: "已售" },
    { id: 3, name: "优质茶叶", quantity: "300斤", price: "120元/斤", status: "运输中" },
  ]);
  const [orders] = useState<Order[]>([
    { id: 1, buyer: "张经理", product: "有机水稻", amount: "1000斤", total: "2800元", status: "待确认", date: "2026-05-01" },
    { id: 2, buyer: "李批发", product: "新鲜蔬菜", amount: "500斤", total: "1750元", status: "已完成", date: "2026-04-28" },
  ]);
  const [supplyForm, setSupplyForm] = useState({ name: "", quantity: "", price: "", desc: "" });
  const [showSupplyForm, setShowSupplyForm] = useState(false);

  /* ---------- Tab4 智能助手 ---------- */
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [videoCallActive, setVideoCallActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /* ---------- Tab5 我的 ---------- */
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

  /* ==================== 任务管理 ==================== */
  const toggleTask = useCallback((id: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }, []);

  const addTask = useCallback(() => {
    if (!newTask.trim()) return;
    setTasks((prev) => [
      ...prev,
      { id: Date.now(), text: newTask.trim(), done: false, date: getTodayStr() },
    ]);
    setNewTask("");
  }, [newTask]);

  /* ==================== 语音助手 ==================== */
  const handleVoiceStart = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAiResponse("您的浏览器不支持语音识别，请使用Chrome浏览器。");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setVoiceText(text);
      setIsListening(false);
      processVoiceQuery(text);
    };
    recognition.onerror = () => {
      setIsListening(false);
      setAiResponse("语音识别失败，请重试。");
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  }, []);

  const processVoiceQuery = useCallback((text: string) => {
    if (text.includes("天气")) {
      setAiResponse(`当前天气：${weather?.description || "多云"}，温度 ${weather?.temperature || 25}°C，湿度 ${weather?.humidity || 65}%。建议关注近期降雨情况，合理安排农事。`);
    } else if (text.includes("种什么") || text.includes("推荐") || text.includes("规划")) {
      setAiResponse("根据您的土地条件，推荐种植：水稻（评分92）、玉米（评分85）、大豆（评分78）。建议优先考虑水稻，当前季节和土壤条件都非常适合。");
    } else if (text.includes("价格") || text.includes("行情") || text.includes("多少钱")) {
      setAiResponse("今日农产品行情：有机水稻 2.8元/斤（稳），新鲜蔬菜 3.5元/斤（涨），优质茶叶 120元/斤（稳）。建议关注市场动态，择机出售。");
    } else if (text.includes("病虫") || text.includes("虫害") || text.includes("病害")) {
      setAiResponse("当前季节常见病虫害：稻飞虱、纹枯病、螟虫。建议：1. 保持田间水位管理；2. 定期巡查叶片；3. 发现异常及时使用生物农药防治。");
    } else {
      setAiResponse(`我理解您的问题是："${text}"。作为智农助手，我可以帮您查询天气、推荐作物、了解价格行情、诊断病虫害。请问您想了解哪方面？`);
    }
  }, [weather]);

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
      setAiResponse("无法打开相机，请检查权限设置。");
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
    setAiResponse("正在进行AI图像分析...\n\n识别结果：检测到水稻作物，生长阶段为分蘖期。健康状态良好，叶片颜色正常。建议：保持3-5cm浅水层，适时追施分蘖肥。");
  }, []);

  /* ==================== 视频通话 ==================== */
  const handleVideoCall = useCallback(() => {
    setVideoCallActive(true);
    setTimeout(() => {
      setVideoCallActive(false);
      setAiResponse("视频通话已结束。专家建议：当前作物长势良好，注意防治纹枯病，建议7天后复查。");
    }, 5000);
  }, []);

  /* ==================== 供应信息发布 ==================== */
  const handleSupplySubmit = useCallback(() => {
    setShowSupplyForm(false);
    setSupplyForm({ name: "", quantity: "", price: "", desc: "" });
  }, []);

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

  /* ==================== 渲染 ==================== */
  return (
    <div className="min-h-screen bg-stone-50 pb-20">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-stone-200">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-green-700">🌿 智农规划</h1>
          <span className="text-xs text-stone-500">{getTodayStr()}</span>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="max-w-lg mx-auto px-4 pt-4">
        {/* ========== Tab1: 种植规划 ========== */}
        {activeTab === 0 && (
          <div className="animate-fade-in space-y-4">
            {/* 步骤指示器 */}
            <div className="flex items-center gap-2 mb-4">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      step >= s ? "bg-green-600 text-white" : "bg-stone-200 text-stone-500"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 4 && <div className={`w-8 h-0.5 ${step > s ? "bg-green-600" : "bg-stone-200"}`} />}
                </div>
              ))}
            </div>

            {/* 步骤1: 土地信息 */}
            {step === 1 && (
              <div className="space-y-4 animate-fade-in-up">
                <h2 className="text-base font-bold text-stone-700">填写土地信息</h2>

                {/* 面积输入 */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">
                    土地面积 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      placeholder="请输入面积"
                      className="flex-1 px-3 py-2.5 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                    <span className="text-sm text-stone-500">亩</span>
                  </div>
                </div>

                {/* 拍照上传 */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">拍照上传（可选）</label>
                  <input ref={fileInputRef} type="file" accept="image/*" capture="environment" onChange={handleImageUpload} className="hidden" />
                  {imagePreview ? (
                    <div className="relative">
                      <img src={imagePreview} alt="土地照片" className="w-full h-40 object-cover rounded-xl" />
                      <button
                        onClick={() => { setImagePreview(null); setImageBase64(null); }}
                        className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg"
                      >
                        重新拍照
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-8 border-2 border-dashed border-stone-300 rounded-xl text-stone-400 text-sm hover:border-green-400 hover:text-green-600 transition-colors"
                    >
                      📷 点击拍照或上传土地照片
                    </button>
                  )}
                </div>

                {/* 土地类型 */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">土地类型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["水田", "旱地", "果园", "菜地", "茶园", "荒地"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setLandType(landType === t ? "" : t)}
                        className={`py-2 px-3 rounded-xl text-sm border transition-colors ${
                          landType === t
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-stone-600 border-stone-300 hover:border-green-400"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 土壤类型 */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">土壤类型</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["壤土", "黏土", "砂土", "黑土", "红壤", "黄土"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setSoilType(soilType === t ? "" : t)}
                        className={`py-2 px-3 rounded-xl text-sm border transition-colors ${
                          soilType === t
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-stone-600 border-stone-300 hover:border-green-400"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 地形 */}
                <div>
                  <label className="block text-sm font-medium text-stone-600 mb-1">地形</label>
                  <div className="grid grid-cols-4 gap-2">
                    {["平原", "丘陵", "山地", "坡地"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setTerrain(terrain === t ? "" : t)}
                        className={`py-2 px-3 rounded-xl text-sm border transition-colors ${
                          terrain === t
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-stone-600 border-stone-300 hover:border-green-400"
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
                  className="w-full py-3 bg-green-600 text-white rounded-xl font-medium text-sm disabled:bg-stone-300 disabled:text-stone-500 transition-colors"
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
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium text-sm disabled:bg-blue-300 transition-colors"
                >
                  {gpsLoading ? "定位中..." : "📍 获取GPS定位"}
                </button>

                {gpsError && <p className="text-xs text-amber-600 text-center">{gpsError}</p>}

                {weather && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 animate-fade-in">
                    <h3 className="text-sm font-bold text-stone-700 mb-3">当前天气</h3>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{getWeatherEmoji(weather.weatherCode)}</span>
                        <div>
                          <p className="text-2xl font-bold text-stone-800">{weather.temperature}°C</p>
                          <p className="text-sm text-stone-500">{weather.description}</p>
                        </div>
                      </div>
                      <div className="text-right text-xs text-stone-500 space-y-1">
                        <p>湿度 {weather.humidity}%</p>
                        <p>风速 {weather.windSpeed}m/s</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 bg-stone-200 text-stone-600 rounded-xl font-medium text-sm"
                  >
                    上一步
                  </button>
                  <button
                    onClick={handleAnalyze}
                    disabled={loading}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium text-sm disabled:bg-green-300 transition-colors"
                  >
                    开始AI分析
                  </button>
                </div>
              </div>
            )}

            {/* 步骤3: 加载中 */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
                <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4" />
                <p className="text-sm font-medium text-stone-600">AI正在分析中...</p>
                <p className="text-xs text-stone-400 mt-1">正在结合土地信息与天气数据生成推荐方案</p>
              </div>
            )}

            {/* 步骤4: 推荐结果 */}
            {step === 4 && (
              <div className="space-y-4 animate-fade-in-up">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-stone-700">推荐种植方案</h2>
                  <button onClick={() => setStep(1)} className="text-xs text-green-600 font-medium">
                    重新规划
                  </button>
                </div>

                {/* 土地摘要 */}
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <p><span className="text-stone-500">面积：</span>{landArea}亩</p>
                    <p><span className="text-stone-500">类型：</span>{landType || "未选择"}</p>
                    <p><span className="text-stone-500">土壤：</span>{soilType || "未选择"}</p>
                    <p><span className="text-stone-500">地形：</span>{terrain || "未选择"}</p>
                  </div>
                </div>

                {/* 推荐列表 */}
                <div className="space-y-3">
                  {recommendation.map((crop, idx) => (
                    <div
                      key={idx}
                      className={`rounded-2xl p-4 border ${getMatchStyle(crop.matchLevel)} animate-fade-in-up`}
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold">{idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}.`}</span>
                          <span className="font-bold text-base">{crop.name}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/60 font-medium">
                          {getMatchLabel(crop.matchLevel)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm mb-2">
                        <span className="font-bold text-green-700">评分 {crop.score}分</span>
                        <span className="text-stone-600">亩利润 ¥{crop.profitPerMu}</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {crop.reasons.map((r, ri) => (
                          <span key={ri} className="text-xs bg-white/50 px-2 py-0.5 rounded-full">{r}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 预估收益 */}
                {recommendation.length > 0 && landArea && (
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
                    <h3 className="text-sm font-bold text-stone-700 mb-2">预估收益（推荐TOP1）</h3>
                    <div className="flex items-end gap-1">
                      <span className="text-3xl font-bold text-green-600">
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

        {/* ========== Tab2: 生产管理 ========== */}
        {activeTab === 1 && (
          <div className="animate-fade-in space-y-4">
            {/* 天气快报 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-80">今日天气快报</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-3xl">{getWeatherEmoji(weather?.weatherCode)}</span>
                    <div>
                      <p className="text-xl font-bold">{weather?.temperature || 25}°C</p>
                      <p className="text-xs opacity-80">{weather?.description || "多云"}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right text-xs space-y-1 opacity-80">
                  <p>湿度 {weather?.humidity || 65}%</p>
                  <p>风速 {weather?.windSpeed || 3}m/s</p>
                </div>
              </div>
              <p className="text-xs mt-2 opacity-70 bg-white/10 rounded-lg px-2 py-1">
                💡 农事建议：当前天气适宜田间作业，建议安排施肥和灌溉。
              </p>
            </div>

            {/* 农事任务 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">今日农事任务</h3>
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                      task.done ? "bg-stone-50" : "bg-green-50"
                    }`}
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        task.done ? "bg-green-600 border-green-600" : "border-stone-300"
                      }`}
                    >
                      {task.done && <span className="text-white text-xs">✓</span>}
                    </button>
                    <span className={`text-sm flex-1 ${task.done ? "line-through text-stone-400" : "text-stone-700"}`}>
                      {task.text}
                    </span>
                    <span className="text-xs text-stone-400">{task.date}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTask()}
                  placeholder="添加新任务..."
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={addTask}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium"
                >
                  添加
                </button>
              </div>
            </div>

            {/* 生长记录 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">生长记录</h3>
              {growthRecords.length === 0 ? (
                <p className="text-sm text-stone-400 text-center py-4">暂无生长记录</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {growthRecords.map((rec, idx) => (
                    <img key={idx} src={rec} alt={`记录${idx + 1}`} className="w-full h-24 object-cover rounded-xl" />
                  ))}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-3 py-3 border-2 border-dashed border-green-300 rounded-xl text-green-600 text-sm hover:bg-green-50 transition-colors"
              >
                📷 拍照记录生长情况
              </button>
            </div>
          </div>
        )}

        {/* ========== Tab3: 采收销售 ========== */}
        {activeTab === 2 && (
          <div className="animate-fade-in space-y-4">
            {/* 产品列表 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">我的产品</h3>
              <div className="space-y-3">
                {products.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-3 bg-stone-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-stone-700">{p.name}</p>
                      <p className="text-xs text-stone-400">{p.quantity} | {p.price}</p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        p.status === "待售"
                          ? "bg-amber-100 text-amber-700"
                          : p.status === "已售"
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 销售订单 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">销售订单</h3>
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="p-3 bg-stone-50 rounded-xl">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-stone-700">{o.buyer}</p>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          o.status === "待确认"
                            ? "bg-amber-100 text-amber-700"
                            : o.status === "已确认"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500">{o.product} x {o.amount}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-sm font-bold text-green-600">{o.total}</span>
                      <span className="text-xs text-stone-400">{o.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 发布供应信息 */}
            {!showSupplyForm ? (
              <button
                onClick={() => setShowSupplyForm(true)}
                className="w-full py-3 bg-green-600 text-white rounded-2xl font-medium text-sm"
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
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={supplyForm.quantity}
                  onChange={(e) => setSupplyForm({ ...supplyForm, quantity: e.target.value })}
                  placeholder="数量（如：5000斤）"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <input
                  type="text"
                  value={supplyForm.price}
                  onChange={(e) => setSupplyForm({ ...supplyForm, price: e.target.value })}
                  placeholder="期望价格（如：2.8元/斤）"
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <textarea
                  value={supplyForm.desc}
                  onChange={(e) => setSupplyForm({ ...supplyForm, desc: e.target.value })}
                  placeholder="产品描述（品质、产地等）"
                  rows={3}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowSupplyForm(false)}
                    className="flex-1 py-2.5 bg-stone-200 text-stone-600 rounded-xl text-sm"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSupplySubmit}
                    className="flex-1 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium"
                  >
                    发布
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========== Tab4: 智能助手 ========== */}
        {activeTab === 3 && (
          <div className="animate-fade-in space-y-4">
            {/* 语音助手 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">🎤 语音助手</h3>
              <p className="text-xs text-stone-400 mb-3">点击麦克风，说出您的问题（天气/种什么/价格/病虫害）</p>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleVoiceStart}
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all ${
                    isListening
                      ? "bg-red-500 text-white animate-pulse-slow scale-110"
                      : "bg-green-600 text-white hover:bg-green-700"
                  }`}
                >
                  🎤
                </button>
                <div className="flex-1">
                  {voiceText && <p className="text-sm text-stone-700">&ldquo;{voiceText}&rdquo;</p>}
                  {!voiceText && <p className="text-sm text-stone-400">等待语音输入...</p>}
                </div>
              </div>
            </div>

            {/* AI 回复 */}
            {aiResponse && (
              <div className="bg-green-50 rounded-2xl p-4 border border-green-100 animate-fade-in-up">
                <h3 className="text-sm font-bold text-green-700 mb-2">🤖 AI回复</h3>
                <p className="text-sm text-stone-700 whitespace-pre-line leading-relaxed">{aiResponse}</p>
              </div>
            )}

            {/* 拍照识别 */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100">
              <h3 className="text-sm font-bold text-stone-700 mb-3">📷 拍照识别</h3>
              {cameraActive && (
                <div className="relative mb-3">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover rounded-xl bg-black" />
                  <button
                    onClick={capturePhoto}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center text-xl"
                  >
                    📸
                  </button>
                  <button
                    onClick={stopCamera}
                    className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded-lg"
                  >
                    关闭
                  </button>
                </div>
              )}
              {capturedFrame && (
                <div className="mb-3">
                  <img src={capturedFrame} alt="拍摄照片" className="w-full h-48 object-cover rounded-xl" />
                  <button
                    onClick={handlePhotoAnalyze}
                    className="w-full mt-2 py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium"
                  >
                    🔍 AI分析
                  </button>
                </div>
              )}
              {!cameraActive && !capturedFrame && (
                <button
                  onClick={startCamera}
                  className="w-full py-6 border-2 border-dashed border-stone-300 rounded-xl text-stone-500 text-sm hover:border-green-400 hover:text-green-600 transition-colors"
                >
                  📷 打开相机拍照识别
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
                  className="w-full py-3 bg-blue-500 text-white rounded-xl font-medium text-sm hover:bg-blue-600 transition-colors"
                >
                  📞 呼叫农业专家
                </button>
              ) : (
                <div className="text-center py-6 animate-fade-in">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl animate-pulse-slow">📞</span>
                  </div>
                  <p className="text-sm font-medium text-stone-700">正在连接专家...</p>
                  <p className="text-xs text-stone-400 mt-1">预计等待时间 1-3 分钟</p>
                  <button
                    onClick={() => setVideoCallActive(false)}
                    className="mt-3 px-6 py-2 bg-red-500 text-white rounded-xl text-sm"
                  >
                    挂断
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========== Tab5: 我的 ========== */}
        {activeTab === 4 && (
          <div className="animate-fade-in space-y-4">
            {/* 用户信息 */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl p-5 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl">
                  👨‍🌾
                </div>
                <div>
                  <p className="text-lg font-bold">{userName}</p>
                  <p className="text-sm opacity-80">{farmName}</p>
                </div>
              </div>
            </div>

            {/* 数据统计 */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 text-center">
                <p className="text-2xl font-bold text-green-600">5</p>
                <p className="text-xs text-stone-500 mt-1">地块数</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 text-center">
                <p className="text-2xl font-bold text-blue-600">12</p>
                <p className="text-xs text-stone-500 mt-1">订单数</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100 text-center">
                <p className="text-2xl font-bold text-amber-600">38</p>
                <p className="text-xs text-stone-500 mt-1">记录数</p>
              </div>
            </div>

            {/* 菜单列表 */}
            <div className="bg-white rounded-2xl shadow-sm border border-stone-100 overflow-hidden">
              {[
                { icon: "📦", label: "我的订单", desc: "查看所有销售订单" },
                { icon: "💰", label: "收益报告", desc: "查看收支与利润分析" },
                { icon: "🗺️", label: "地块管理", desc: "管理我的所有地块" },
                { icon: "🔔", label: "消息通知", desc: "系统消息与提醒" },
                { icon: "⚙️", label: "设置", desc: "账户与应用设置" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-stone-50 transition-colors border-b border-stone-100 last:border-b-0"
                >
                  <span className="text-xl">{item.icon}</span>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-stone-700">{item.label}</p>
                    <p className="text-xs text-stone-400">{item.desc}</p>
                  </div>
                  <span className="text-stone-300 text-sm">›</span>
                </button>
              ))}
            </div>

            {/* 版本信息 */}
            <p className="text-center text-xs text-stone-400 py-4">智农规划 v1.0.0</p>
          </div>
        )}
      </main>

      {/* 底部导航栏 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-stone-200 z-50">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 flex flex-col items-center py-2 pt-2.5 transition-colors ${
                activeTab === idx ? "text-green-600" : "text-stone-400"
              }`}
            >
              <span className={`text-lg ${activeTab === idx ? "scale-110 transition-transform" : ""}`}>
                {tab.icon}
              </span>
              <span className={`text-[10px] mt-0.5 ${activeTab === idx ? "font-bold" : ""}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
