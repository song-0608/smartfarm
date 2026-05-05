"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// ====== 类型定义 ======
interface WeatherData {
  current: { temperature: number; humidity: number; weatherText: string; weatherCode: number; windSpeed: number };
  daily: { date: string; tempMax: number; tempMin: number; precipitation: number; uvIndex: number }[];
  summary: { avgTemperature: number; totalPrecipitation: number; avgSoilMoisture: number | null; season: string; suitableCrops: string[] };
}

interface AnalysisData {
  source: string; message?: string;
  analysis: { landType: string; soilType: string; terrain: string; fertility: string; drainage: string; suitableCrops: string[]; suggestions: string[]; aiDetails?: { soilColor?: string; soilMoisture?: string; vegetation?: string } };
}

interface Recommendation {
  rank: number; name: string; score: number; matchLevel: string; reasons: string[];
  season: string; cycleDays: number; difficulty: string; waterNeed: string;
  revenuePerMu: number; costPerMu: number; profitPerMu: number; totalProfit: number;
}

interface RecommendResult {
  recommendations: Recommendation[];
  summary: { bestChoice: string; topCrops: string[]; totalOptions: number; avgScore: number; weatherAdvice: string[]; generalAdvice: string[] };
}

interface TaskItem { id: string; title: string; done: boolean; date: string; category: string; }
interface ProductItem { id: string; name: string; quantity: string; unit: string; price: string; status: string; }
interface OrderItem { id: string; buyer: string; product: string; quantity: string; price: string; status: string; date: string; }

// ====== 天气图标 ======
function getWeatherIcon(code: number): string {
  if (code === 0) return "☀️"; if (code <= 2) return "⛅"; if (code === 3) return "☁️";
  if (code <= 48) return "🌫️"; if (code <= 67) return "🌧️"; if (code <= 77) return "🌨️";
  if (code <= 82) return "🌦️"; return "⛈️";
}

// ====== 底部导航配置 ======
const tabs = [
  { id: "plan", label: "种植规划", icon: "🌾" },
  { id: "manage", label: "生产管理", icon: "📋" },
  { id: "harvest", label: "采收销售", icon: "🚜" },
  { id: "multimodal", label: "智能助手", icon: "🤖" },
  { id: "profile", label: "我的", icon: "👤" },
];

// ====== 主组件 ======
export default function Home() {
  const [activeTab, setActiveTab] = useState("plan");
  // 种植规划状态
  const [step, setStep] = useState(1);
  const [landArea, setLandArea] = useState("");
  const [landType, setLandType] = useState("");
  const [soilType, setSoilType] = useState("");
  const [terrain, setTerrain] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationText, setLocationText] = useState("获取位置中...");
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendResult | null>(null);
  const [loading, setLoading] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 生产管理状态
  const [tasks, setTasks] = useState<TaskItem[]>([
    { id: "1", title: "检查灌溉系统", done: false, date: "2026-05-06", category: "灌溉" },
    { id: "2", title: "施第一次追肥", done: false, date: "2026-05-08", category: "施肥" },
    { id: "3", title: "防治蚜虫", done: true, date: "2026-05-05", category: "植保" },
    { id: "4", title: "除草（第三轮）", done: false, date: "2026-05-10", category: "除草" },
  ]);
  const [newTask, setNewTask] = useState("");

  // 采收销售状态
  const [products] = useState<ProductItem[]>([
    { id: "1", name: "番茄", quantity: "500", unit: "斤", price: "3.5", status: "待售" },
    { id: "2", name: "黄瓜", quantity: "300", unit: "斤", price: "2.0", status: "已预订" },
    { id: "3", name: "辣椒", quantity: "200", unit: "斤", price: "4.0", status: "运输中" },
  ]);
  const [orders] = useState<OrderItem[]>([
    { id: "1", buyer: "盒马鲜生", product: "番茄", quantity: "200斤", price: "3.8元/斤", status: "已完成", date: "2026-05-03" },
    { id: "2", buyer: "美团优选", product: "黄瓜", quantity: "300斤", price: "2.0元/斤", status: "待发货", date: "2026-05-06" },
  ]);

  // 全模态状态
  const [voiceText, setVoiceText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAiResponse] = useState("");
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [videoCallActive, setVideoCallActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const recognitionRef = useRef<any>(null);

  // ====== 通用方法 ======
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocationText("定位不可用"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setLocationText(`${pos.coords.latitude.toFixed(2)}°N, ${pos.coords.longitude.toFixed(2)}°E`); },
      () => { setLocation({ lat: 39.9, lon: 116.4 }); setLocationText("默认位置（北京）"); },
      { timeout: 5000 }
    );
  }, []);

  const handleImage = (file: File) => {
    if (file.size > 5 * 1024 * 1024) { setError("图片不能超过5MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => { const r = e.target?.result as string; setImagePreview(r); setImageBase64(r.split(",")[1]); };
    reader.readAsDataURL(file);
  };

  const fetchWeather = async () => {
    if (!location) return null;
    setLoading("获取天气...");
    try {
      const res = await fetch(`/api/weather?lat=${location.lat}&lon=${location.lon}`);
      if (!res.ok) throw new Error();
      const data = await res.json(); setWeather(data); return data;
    } catch { setError("天气获取失败"); return null; }
  };

  const analyzeLand = async () => {
    setLoading("分析土地...");
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imageBase64 ? `data:image/jpeg;base64,${imageBase64}` : null, landType: landType || undefined, soilType: soilType || undefined, terrain: terrain || undefined }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json(); setAnalysis(data);
      if (data.analysis) { if (data.analysis.landType && !landType) setLandType(data.analysis.landType); if (data.analysis.soilType && !soilType) setSoilType(data.analysis.soilType); if (data.analysis.terrain && !terrain) setTerrain(data.analysis.terrain); }
      return data;
    } catch { setError("分析失败"); return null; }
  };

  const fetchRecommendation = async (w: WeatherData, a: AnalysisData) => {
    setLoading("生成规划...");
    try {
      const res = await fetch("/api/recommend", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ landInfo: { area: parseFloat(landArea) || 1, landType: landType || a?.analysis?.landType || "耕地", soilType: soilType || a?.analysis?.soilType || "壤土", terrain: terrain || a?.analysis?.terrain || "平原", fertility: a?.analysis?.fertility || "中", drainage: a?.analysis?.drainage || "中" }, weatherInfo: w.summary, aiAnalysis: a?.analysis }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json(); setRecommendation(data);
    } catch { setError("规划生成失败"); }
  };

  const nextStep = async () => {
    setError("");
    if (step === 1) { if (!landArea || parseFloat(landArea) <= 0) { setError("请输入有效面积"); return; } setStep(2); getLocation(); }
    else if (step === 2) { const w = await fetchWeather(); if (w) { setStep(3); const a = await analyzeLand(); if (a) await fetchRecommendation(w, a); setStep(4); } setLoading(""); }
  };

  // ====== 语音识别 ======
  const startVoice = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) { setAiResponse("您的浏览器不支持语音识别，请使用Chrome"); return; }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = "zh-CN"; recognition.continuous = false; recognition.interimResults = true;
    recognition.onresult = (e: any) => { const t = Array.from(e.results).map((r: any) => r[0].transcript).join(""); setVoiceText(t); };
    recognition.onend = () => { setIsListening(false); if (voiceText) handleVoiceQuery(voiceText); };
    recognition.onerror = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start(); setIsListening(true);
  }, [voiceText]);

  const stopVoice = () => { recognitionRef.current?.stop(); setIsListening(false); };

  const handleVoiceQuery = async (query: string) => {
    setAiResponse("正在分析您的问题...");
    const q = query.toLowerCase();
    if (q.includes("天气") || q.includes("温度") || q.includes("下雨")) {
      setAiResponse(`🌤️ 根据当前位置天气情况：\n\n当前温度${weather?.current.temperature || "--"}°C，${weather?.current.weatherText || "--"}。\n湿度${weather?.current.humidity || "--"}%，风速${weather?.current.windSpeed || "--"}km/h。\n\n未来7天平均温度${weather?.summary.avgTemperature || "--"}°C，总降水量${weather?.summary.totalPrecipitation || "--"}mm。\n\n适宜种植：${weather?.summary.suitableCrops?.join("、") || "--"}。`);
    } else if (q.includes("种什么") || q.includes("推荐") || q.includes("规划")) {
      if (recommendation) {
        const top3 = recommendation.recommendations.slice(0, 3).map((r) => `${r.rank}. ${r.name}（${r.score}分，亩利润¥${r.profitPerMu}）`).join("\n");
        setAiResponse(`🌿 根据您的土地和天气条件，推荐种植：\n\n${top3}\n\n🏆 最佳选择：${recommendation.summary.bestChoice}\n\n${recommendation.summary.weatherAdvice[0] || ""}`);
      } else { setAiResponse("请先完成种植规划，获取个性化推荐结果。点击底部\"种植规划\"开始。"); }
    } else if (q.includes("价格") || q.includes("多少钱") || q.includes("收益")) {
      setAiResponse(`💰 收益参考（基于当前分析）：\n\n${recommendation?.recommendations.slice(0, 5).map((r) => `${r.name}：亩产值¥${r.revenuePerMu}，亩成本¥${r.costPerMu}，亩利润¥${r.profitPerMu}`).join("\n") || "请先完成种植规划获取收益数据。"}`);
    } else if (q.includes("病虫害") || q.includes("虫") || q.includes("病")) {
      setAiResponse(`🐛 常见病虫害防治建议：\n\n1. 蚜虫：可用吡虫啉喷雾，注意交替用药\n2. 白粉病：发病初期用三唑酮防治\n3. 红蜘蛛：用阿维菌素喷雾\n\n建议：定期巡田检查，发现病虫害早期症状及时处理。如需远程专家指导，可使用视频通话功能。`);
    } else {
      setAiResponse(`我理解您的问题是："${query}"\n\n目前我支持以下语音查询：\n- "今天天气怎么样"\n- "我应该种什么"\n- "XX能赚多少钱"\n- "番茄有病虫害怎么办"\n\n您也可以直接拍照上传土地照片，我会自动分析。`);
    }
  };

  // ====== 相机 ======
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setCameraStream(stream); setCameraActive(true);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch { setAiResponse("无法访问摄像头，请检查权限设置"); }
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null); setCameraActive(false);
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current; const canvas = canvasRef.current;
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    setCapturedFrame(canvas.toDataURL("image/jpeg", 0.8));
    stopCamera();
  };

  // ====== 匹配配置 ======
  const matchCfg: Record<string, { label: string; color: string; bg: string }> = {
    strong: { label: "强烈推荐", color: "text-farm-700", bg: "bg-farm-50 border-farm-200" },
    medium: { label: "可以尝试", color: "text-earth-700", bg: "bg-earth-50 border-earth-200" },
    weak: { label: "条件欠佳", color: "text-stone-500", bg: "bg-stone-50 border-stone-200" },
  };

  // ====== 渲染 ======
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      {/* 顶部栏 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-stone-200">
        <div className="max-w-lg mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-xl">🌾</span>
            <h1 className="text-base font-bold text-farm-800">智农规划</h1>
            <span className="text-xs bg-farm-100 text-farm-700 px-1.5 py-0.5 rounded-full font-medium">全模态</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-stone-400">
            <span>📷</span><span>🎤</span><span>📹</span><span>🌐</span>
          </div>
        </div>
      </header>

      {/* 内容区 */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pb-20 overflow-y-auto">

        {/* ===== 种植规划 Tab ===== */}
        {activeTab === "plan" && (
          <div className="py-4 space-y-5 animate-fade-in">
            {step < 4 && (
              <div className="bg-white border-b border-stone-100 -mx-4 px-4 py-2.5 flex items-center gap-1">
                {[{ n: 1, l: "土地信息" }, { n: 2, l: "天气" }, { n: 3, l: "规划结果" }].map((s, i) => (
                  <div key={s.n} className="flex items-center flex-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step >= s.n ? "bg-farm-600 text-white" : "bg-stone-200 text-stone-500"}`}>{step > s.n ? "✓" : s.n}</div>
                    <span className={`text-[10px] font-medium ml-1 ${step >= s.n ? "text-farm-700" : "text-stone-400"}`}>{s.l}</span>
                    {i < 2 && <div className={`flex-1 h-px mx-1.5 ${step > s.n ? "bg-farm-400" : "bg-stone-200"}`} />}
                  </div>
                ))}
              </div>
            )}

            {step === 1 && (<>
              <h2 className="text-lg font-bold text-stone-900">录入土地信息</h2>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">土地照片（可选，AI分析）</label>
                {imagePreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-stone-200">
                    <img src={imagePreview} alt="土地" className="w-full h-40 object-cover" />
                    <button onClick={() => { setImagePreview(null); setImageBase64(null); }} className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center text-xs">✕</button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-stone-300 rounded-xl p-5 text-center hover:border-farm-400 transition-colors">
                    <div className="text-2xl mb-1">📷</div>
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.capture = "environment"; i.onchange = (e) => { const f = (e.target as HTMLInputElement).files?.[0]; if (f) handleImage(f); }; i.click(); }} className="px-3 py-1.5 bg-farm-600 text-white text-xs rounded-lg">拍照</button>
                      <button onClick={() => fileInputRef.current?.click()} className="px-3 py-1.5 bg-white border border-stone-300 text-stone-600 text-xs rounded-lg">相册</button>
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImage(f); }} className="hidden" />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">土地面积 <span className="text-red-500">*</span></label>
                <div className="relative"><input type="number" value={landArea} onChange={(e) => setLandArea(e.target.value)} placeholder="请输入面积" className="w-full px-3 py-2.5 border border-stone-300 rounded-lg text-sm" min="0.1" step="0.1" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 text-xs">亩</span></div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">土地类型</label>
                <div className="grid grid-cols-3 gap-1.5">{["水田", "旱地", "果园", "菜地", "茶园", "荒地"].map((t) => (<button key={t} onClick={() => setLandType(landType === t ? "" : t)} className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${landType === t ? "bg-farm-600 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>{t}</button>))}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">土壤类型</label>
                <div className="grid grid-cols-3 gap-1.5">{["壤土", "黏土", "砂土", "黑土", "红壤", "黄土"].map((t) => (<button key={t} onClick={() => setSoilType(soilType === t ? "" : t)} className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${soilType === t ? "bg-earth-500 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>{t}</button>))}</div>
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1.5">地形</label>
                <div className="grid grid-cols-4 gap-1.5">{["平原", "丘陵", "山地", "坡地"].map((t) => (<button key={t} onClick={() => setTerrain(terrain === t ? "" : t)} className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${terrain === t ? "bg-sky-600 text-white" : "bg-white border border-stone-200 text-stone-600"}`}>{t}</button>))}</div>
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-lg">{error}</div>}
              <button onClick={nextStep} className="w-full py-3 bg-farm-600 text-white font-bold text-sm rounded-xl">下一步 →</button>
            </>)}

            {step === 2 && (<>
              <h2 className="text-lg font-bold text-stone-900">天气环境</h2>
              <p className="text-xs text-stone-500">{locationText}</p>
              {loading && <div className="text-center py-10"><div className="text-3xl mb-2 animate-pulse-slow">🌤️</div><p className="text-sm text-stone-500">{loading}</p></div>}
              {!loading && weather && (<div className="space-y-3 animate-fade-in-up">
                <div className="bg-gradient-to-br from-sky-500 to-sky-600 rounded-xl p-4 text-white">
                  <div className="flex items-center justify-between"><div><div className="text-3xl font-bold">{weather.current.temperature}°C</div><div className="text-sky-100 text-sm">{weather.current.weatherText}</div></div><div className="text-5xl">{getWeatherIcon(weather.current.weatherCode)}</div></div>
                  <div className="flex gap-3 mt-3 text-xs text-sky-100"><span>💧 {weather.current.humidity}%</span><span>🌬️ {weather.current.windSpeed}km/h</span></div>
                </div>
                <div className="bg-white rounded-xl border border-stone-200 p-3">
                  <h3 className="text-xs font-bold text-stone-700 mb-2">7日预报</h3>
                  <div className="flex gap-1 overflow-x-auto">{weather.daily.map((d, i) => (<div key={d.date} className={`flex-shrink-0 w-14 text-center py-1.5 rounded-lg ${i === 0 ? "bg-sky-50" : ""}`}><div className="text-[10px] text-stone-500">{i === 0 ? "今天" : d.date.slice(5)}</div><div className="text-base my-0.5">{getWeatherIcon(d.precipitation > 5 ? 61 : d.tempMax > 30 ? 0 : 2)}</div><div className="text-[10px] font-medium">{d.tempMax}°</div><div className="text-[10px] text-stone-400">{d.tempMin}°</div></div>))}</div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white rounded-lg border border-stone-200 p-3"><div className="text-[10px] text-stone-500">季节</div><div className="text-sm font-bold text-farm-700">{weather.summary.season}</div></div>
                  <div className="bg-white rounded-lg border border-stone-200 p-3"><div className="text-[10px] text-stone-500">均温</div><div className="text-sm font-bold">{weather.summary.avgTemperature}°C</div></div>
                  <div className="bg-white rounded-lg border border-stone-200 p-3"><div className="text-[10px] text-stone-500">降水</div><div className="text-sm font-bold text-sky-600">{weather.summary.totalPrecipitation}mm</div></div>
                </div>
                <div className="bg-farm-50 rounded-xl border border-farm-200 p-3"><h3 className="text-xs font-bold text-farm-700 mb-1.5">🌱 适宜种植</h3><div className="flex flex-wrap gap-1">{weather.summary.suitableCrops.map((c) => (<span key={c} className="px-2 py-0.5 bg-white text-farm-700 text-[10px] rounded-full border border-farm-200">{c}</span>))}</div></div>
              </div>)}
              {!loading && <button onClick={nextStep} className="w-full py-3 bg-farm-600 text-white font-bold text-sm rounded-xl">生成种植规划 →</button>}
            </>)}

            {step === 3 && <div className="py-12 text-center animate-fade-in"><div className="text-4xl mb-3 animate-pulse-slow">🧑‍🌾</div><p className="text-sm text-stone-600">{loading || "分析中..."}</p></div>}

            {step === 4 && recommendation && <div className="py-3 space-y-4 animate-fade-in-up">
              <div className="bg-gradient-to-br from-farm-600 to-farm-700 rounded-xl p-4 text-white"><div className="text-xs text-farm-100">最佳选择</div><div className="text-xl font-bold">🏆 {recommendation.summary.bestChoice}</div><div className="flex flex-wrap gap-1 mt-2">{recommendation.summary.topCrops.map((c) => (<span key={c} className="px-2 py-0.5 bg-white/20 text-xs rounded-full">{c}</span>))}</div></div>
              {analysis && <div className="bg-white rounded-xl border border-stone-200 p-3"><h3 className="text-xs font-bold text-stone-700 mb-2">📋 土地分析</h3><div className="grid grid-cols-3 gap-1 text-xs"><div className="flex justify-between py-1 border-b border-stone-100"><span className="text-stone-500">类型</span><span className="font-medium">{analysis.analysis.landType}</span></div><div className="flex justify-between py-1 border-b border-stone-100"><span className="text-stone-500">土壤</span><span className="font-medium">{analysis.analysis.soilType}</span></div><div className="flex justify-between py-1 border-b border-stone-100"><span className="text-stone-500">肥力</span><span className="font-medium">{analysis.analysis.fertility}</span></div></div></div>}
              <div><h3 className="text-xs font-bold text-stone-700 mb-2">🌿 推荐排行</h3><div className="space-y-2">{recommendation.recommendations.slice(0, 5).map((crop) => { const cfg = matchCfg[crop.matchLevel] || matchCfg.weak; return (<div key={crop.name} className={`rounded-xl border p-3 ${cfg.bg}`}><div className="flex items-center justify-between mb-1.5"><div className="flex items-center gap-1.5"><span className="text-sm font-bold text-stone-300">#{crop.rank}</span><span className="font-bold text-sm text-stone-800">{crop.name}</span><span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${cfg.color} bg-white/80 border`}>{cfg.label}</span></div><div className="text-sm font-bold text-farm-600">{crop.score}分</div></div><div className="grid grid-cols-4 gap-1 text-[10px]"><div><div className="text-stone-400">季节</div><div className="font-medium">{crop.season}</div></div><div><div className="text-stone-400">周期</div><div className="font-medium">{crop.cycleDays}天</div></div><div><div className="text-stone-400">难度</div><div className="font-medium">{crop.difficulty}</div></div><div><div className="text-stone-400">需水</div><div className="font-medium">{crop.waterNeed}</div></div></div><div className="mt-2 pt-2 border-t border-stone-200/50 flex items-end justify-between"><div className="text-[10px] text-stone-500">亩产值¥{crop.revenuePerMu} · 成本¥{crop.costPerMu}</div><div className="text-right"><div className="text-[10px] text-stone-400">亩利润</div><div className="text-sm font-bold text-farm-600">¥{crop.profitPerMu}</div></div></div></div>); })}</div></div>
              {analysis?.analysis.suggestions && <div className="bg-earth-50 rounded-xl border border-earth-200 p-3"><h3 className="text-xs font-bold text-earth-700 mb-1.5">💡 改良建议</h3><ul className="space-y-1">{analysis.analysis.suggestions.map((s, i) => (<li key={i} className="text-xs text-earth-800 flex gap-1.5"><span className="text-earth-400">•</span>{s}</li>))}</ul></div>}
              <button onClick={() => { setStep(1); setWeather(null); setAnalysis(null); setRecommendation(null); setImagePreview(null); setImageBase64(null); setLandArea(""); setLandType(""); setSoilType(""); setTerrain(""); }} className="w-full py-3 bg-white border border-stone-300 text-stone-700 font-bold text-sm rounded-xl">重新规划</button>
            </div>}
          </div>
        )}

        {/* ===== 生产管理 Tab ===== */}
        {activeTab === "manage" && (
          <div className="py-4 space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-stone-900">📋 生产管理</h2>
            {/* 天气快报 */}
            {weather && <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-xl p-3 text-white flex items-center justify-between"><div><div className="text-2xl font-bold">{weather.current.temperature}°C</div><div className="text-sky-100 text-xs">{weather.current.weatherText}</div></div><div className="text-3xl">{getWeatherIcon(weather.current.weatherCode)}</div></div>}
            {/* 农事日历 */}
            <div className="bg-white rounded-xl border border-stone-200 p-3">
              <h3 className="text-xs font-bold text-stone-700 mb-2">📅 农事任务</h3>
              <div className="flex gap-1.5 mb-2">{["全部", "灌溉", "施肥", "植保", "除草"].map((c) => (<button key={c} className="px-2 py-1 bg-stone-100 text-stone-600 text-[10px] rounded-full">{c}</button>))}</div>
              <div className="space-y-1.5">{tasks.map((task) => (<div key={task.id} className={`flex items-center gap-2 p-2 rounded-lg border ${task.done ? "bg-stone-50 border-stone-100" : "bg-white border-stone-200"}`}><button onClick={() => setTasks(tasks.map((t) => t.id === task.id ? { ...t, done: !t.done } : t))} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center text-[10px] ${task.done ? "bg-farm-500 border-farm-500 text-white" : "border-stone-300"}`}>{task.done ? "✓" : ""}</button><div className="flex-1 min-w-0"><div className={`text-xs ${task.done ? "line-through text-stone-400" : "text-stone-700"}`}>{task.title}</div><div className="text-[10px] text-stone-400">{task.date} · {task.category}</div></div></div>))}</div>
              <div className="flex gap-2 mt-2"><input type="text" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="添加新任务..." className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-xs" onKeyDown={(e) => { if (e.key === "Enter" && newTask.trim()) { setTasks([...tasks, { id: Date.now().toString(), title: newTask.trim(), done: false, date: new Date().toISOString().slice(0, 10), category: "其他" }]); setNewTask(""); } }} /><button onClick={() => { if (newTask.trim()) { setTasks([...tasks, { id: Date.now().toString(), title: newTask.trim(), done: false, date: new Date().toISOString().slice(0, 10), category: "其他" }]); setNewTask(""); } }} className="px-3 py-2 bg-farm-600 text-white text-xs rounded-lg">添加</button></div>
            </div>
            {/* 生长记录 */}
            <div className="bg-white rounded-xl border border-stone-200 p-3">
              <h3 className="text-xs font-bold text-stone-700 mb-2">📸 生长记录</h3>
              <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center">
                <div className="text-2xl mb-1">📷</div>
                <p className="text-[10px] text-stone-500 mb-2">拍照记录作物生长状态</p>
                <button onClick={() => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.capture = "environment"; i.click(); }} className="px-3 py-1.5 bg-farm-600 text-white text-xs rounded-lg">拍照记录</button>
              </div>
            </div>
          </div>
        )}

        {/* ===== 采收销售 Tab ===== */}
        {activeTab === "harvest" && (
          <div className="py-4 space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-stone-900">🚜 采收销售</h2>
            {/* 产品列表 */}
            <div className="bg-white rounded-xl border border-stone-200 p-3">
              <h3 className="text-xs font-bold text-stone-700 mb-2">📦 我的产品</h3>
              <div className="space-y-2">{products.map((p) => (<div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg border border-stone-100"><div className="flex items-center gap-2"><span className="text-lg">🍅</span><div><div className="text-xs font-medium">{p.name}</div><div className="text-[10px] text-stone-400">{p.quantity}{p.unit} · ¥{p.price}/{p.unit.replace("斤", "")}</div></div></div><span className={`text-[10px] px-2 py-0.5 rounded-full ${p.status === "已预订" ? "bg-sky-100 text-sky-700" : p.status === "运输中" ? "bg-earth-100 text-earth-700" : "bg-stone-100 text-stone-600"}`}>{p.status}</span></div>))}</div>
            </div>
            {/* 订单列表 */}
            <div className="bg-white rounded-xl border border-stone-200 p-3">
              <h3 className="text-xs font-bold text-stone-700 mb-2">🛒 销售订单</h3>
              <div className="space-y-2">{orders.map((o) => (<div key={o.id} className="p-2.5 rounded-lg border border-stone-100"><div className="flex items-center justify-between mb-1"><span className="text-xs font-medium">{o.buyer}</span><span className={`text-[10px] px-2 py-0.5 rounded-full ${o.status === "已完成" ? "bg-farm-100 text-farm-700" : "bg-earth-100 text-earth-700"}`}>{o.status}</span></div><div className="text-[10px] text-stone-500">{o.product} · {o.quantity} · {o.price} · {o.date}</div></div>))}</div>
            </div>
            {/* 发布供应 */}
            <div className="bg-farm-50 rounded-xl border border-farm-200 p-3">
              <h3 className="text-xs font-bold text-farm-700 mb-2">📢 发布供应信息</h3>
              <div className="space-y-2"><input placeholder="产品名称" className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white" /><div className="flex gap-2"><input placeholder="数量" className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white" /><input placeholder="期望价格" className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white" /></div><button className="w-full py-2 bg-farm-600 text-white text-xs rounded-lg font-medium">发布供应</button></div>
            </div>
          </div>
        )}

        {/* ===== 智能助手 Tab ===== */}
        {activeTab === "multimodal" && (
          <div className="py-4 space-y-4 animate-fade-in">
            <h2 className="text-lg font-bold text-stone-900">🤖 智能助手</h2>
            <p className="text-xs text-stone-500">支持语音、拍照、视频通话等多模态交互</p>

            {/* 语音交互 */}
            <div className="bg-white rounded-xl border border-stone-200 p-3">
              <h3 className="text-xs font-bold text-stone-700 mb-2">🎤 语音助手</h3>
              <p className="text-[10px] text-stone-400 mb-2">试试说："今天天气怎么样"、"我应该种什么"、"番茄有虫怎么办"</p>
              <div className="flex items-center gap-2">
                <button onClick={isListening ? stopVoice : startVoice} className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isListening ? "bg-red-500 animate-pulse" : "bg-farm-600"} text-white`}>{isListening ? "⏹" : "🎤"}</button>
                <div className="flex-1 px-3 py-2 bg-stone-50 rounded-lg text-xs text-stone-600 min-h-[36px]">{voiceText || (isListening ? "正在聆听..." : "点击麦克风开始语音输入")}</div>
              </div>
            </div>

            {/* 拍照识别 */}
            <div className="bg-white rounded-xl border border-stone-200 p-3">
              <h3 className="text-xs font-bold text-stone-700 mb-2">📷 拍照识别</h3>
              <p className="text-[10px] text-stone-400 mb-2">拍照识别作物、病虫害、土壤状况</p>
              {!cameraActive && !capturedFrame && <div className="border-2 border-dashed border-stone-300 rounded-lg p-4 text-center"><div className="text-2xl mb-1">📷</div><button onClick={startCamera} className="px-4 py-2 bg-farm-600 text-white text-xs rounded-lg">打开相机</button></div>}
              {cameraActive && <div className="relative rounded-lg overflow-hidden bg-black"><video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover" /><div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2"><button onClick={captureFrame} className="px-4 py-1.5 bg-white text-stone-800 text-xs rounded-lg font-medium">📸 拍照</button><button onClick={stopCamera} className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg">关闭</button></div></div>}
              {capturedFrame && <div className="relative rounded-lg overflow-hidden"><img src={capturedFrame} alt="拍摄" className="w-full h-48 object-cover" /><div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2"><button onClick={() => setCapturedFrame(null)} className="px-4 py-1.5 bg-white text-stone-800 text-xs rounded-lg font-medium">重拍</button><button onClick={() => { setAiResponse("正在分析照片中的作物/病虫害/土壤状况...\n\n✅ 识别结果：番茄（健康）\n生长阶段：开花期\n建议：注意防治灰霉病，保持通风，适当控制浇水量。"); }} className="px-4 py-1.5 bg-farm-600 text-white text-xs rounded-lg font-medium">AI分析</button></div></div>}
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* 视频通话 */}
            <div className="bg-white rounded-xl border border-stone-200 p-3">
              <h3 className="text-xs font-bold text-stone-700 mb-2">📹 远程专家视频</h3>
              <p className="text-[10px] text-stone-400 mb-2">连线农技专家，远程诊断病虫害</p>
              {!videoCallActive ? <button onClick={() => setVideoCallActive(true)} className="w-full py-3 bg-sky-600 text-white text-xs rounded-lg font-medium">📞 呼叫专家</button> : (
                <div className="text-center py-4">
                  <div className="w-16 h-16 bg-sky-100 rounded-full flex items-center justify-center text-3xl mx-auto mb-2 animate-pulse-slow">📞</div>
                  <p className="text-xs text-stone-600 mb-1">正在连接专家...</p>
                  <p className="text-[10px] text-stone-400 mb-3">等待专家接听中</p>
                  <button onClick={() => setVideoCallActive(false)} className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg">挂断</button>
                </div>
              )}
            </div>

            {/* AI回复 */}
            {aiResponse && <div className="bg-farm-50 rounded-xl border border-farm-200 p-3"><h3 className="text-xs font-bold text-farm-700 mb-1.5">🤖 AI回复</h3><pre className="text-xs text-stone-700 whitespace-pre-wrap font-sans">{aiResponse}</pre></div>}
          </div>
        )}

        {/* ===== 我的 Tab ===== */}
        {activeTab === "profile" && (
          <div className="py-4 space-y-4 animate-fade-in">
            <div className="bg-gradient-to-br from-farm-600 to-farm-700 rounded-xl p-4 text-white text-center">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">👨‍🌾</div>
              <div className="text-base font-bold">张农户</div>
              <div className="text-xs text-farm-100">山东金乡县 · 5亩耕地</div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="bg-white rounded-xl border border-stone-200 p-3 text-center"><div className="text-lg font-bold text-farm-600">5</div><div className="text-[10px] text-stone-500">管理地块</div></div>
              <div className="bg-white rounded-xl border border-stone-200 p-3 text-center"><div className="text-lg font-bold text-sky-600">3</div><div className="text-[10px] text-stone-500">完成订单</div></div>
              <div className="bg-white rounded-xl border border-stone-200 p-3 text-center"><div className="text-lg font-bold text-earth-600">12</div><div className="text-[10px] text-stone-500">农事记录</div></div>
            </div>
            <div className="bg-white rounded-xl border border-stone-200 divide-y divide-stone-100">
              {[{ icon: "📋", label: "我的订单", desc: "查看历史订单" }, { icon: "📊", label: "收益报告", desc: "本月收益分析" }, { icon: "📍", label: "地块管理", desc: "管理我的地块" }, { icon: "🔔", label: "消息通知", desc: "天气预警、订单提醒" }, { icon: "⚙️", label: "设置", desc: "账户、通知、帮助" }].map((item) => (<button key={item.label} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50 transition-colors"><span className="text-lg">{item.icon}</span><div className="flex-1"><div className="text-xs font-medium text-stone-800">{item.label}</div><div className="text-[10px] text-stone-400">{item.desc}</div></div><span className="text-stone-300 text-xs">›</span></button>))}
            </div>
          </div>
        )}
      </main>

      {/* 底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-stone-200 z-50">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center py-2 transition-colors ${activeTab === tab.id ? "text-farm-600" : "text-stone-400"}`}>
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[10px] mt-0.5 font-medium">{tab.label}</span>
              {activeTab === tab.id && <div className="w-1 h-1 bg-farm-600 rounded-full mt-0.5" />}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
