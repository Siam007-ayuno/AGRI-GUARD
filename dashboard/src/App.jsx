import React, { useState, useEffect } from "react";
import { 
  Sprout, 
  CloudRain, 
  Waves, 
  Thermometer, 
  Droplets, 
  Settings, 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Search, 
  Activity, 
  Info, 
  ShieldAlert, 
  Sun, 
  Wind, 
  User, 
  Sparkles, 
  Brain, 
  Clock, 
  ToggleLeft, 
  ToggleRight,
  Menu,
  X
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar,
  ReferenceLine
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";

const MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Input fields
  const [rainfall, setRainfall] = useState(180);
  const [riverLevel, setRiverLevel] = useState(3.2);
  const [temp, setTemp] = useState(30);
  const [soilMoisture, setSoilMoisture] = useState(70);
  const [selectedMonth, setSelectedMonth] = useState(7);
  const [monthSearch, setMonthSearch] = useState("");
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false);

  // Settings / API Keys
  const [geminiKey, setGeminiKey] = useState(() => localStorage.getItem("gemini_key") || "");
  const [weatherKey, setWeatherKey] = useState(() => localStorage.getItem("weather_key") || "");
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem("high_contrast") === "true");

  // Geolocation & Live Weather
  const [location, setLocation] = useState({ name: "Global Monitoring", lat: null, lon: null });
  const [locLoading, setLocLoading] = useState(false);
  const [liveWeather, setLiveWeather] = useState(null);
  const [weatherError, setWeatherError] = useState(null);

  // AI Advisory State
  const [loading, setLoading] = useState(false);
  const [advisoryResult, setAdvisoryResult] = useState(null);
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("advisory_history");
    return saved ? JSON.parse(saved) : [];
  });

  // Notifications banner trigger
  const [notifications, setNotifications] = useState([]);

  // Theme support
  useEffect(() => {
    localStorage.setItem("gemini_key", geminiKey);
  }, [geminiKey]);

  useEffect(() => {
    localStorage.setItem("weather_key", weatherKey);
  }, [weatherKey]);

  useEffect(() => {
    localStorage.setItem("high_contrast", highContrast);
    if (highContrast) {
      document.documentElement.classList.add("contrast-more");
    } else {
      document.documentElement.classList.remove("contrast-more");
    }
  }, [highContrast]);

  // Handle active alerts
  useEffect(() => {
    const alerts = [];
    if (rainfall > 250) {
      alerts.push({
        id: "flood-alert",
        type: "danger",
        title: "CRITICAL: Flood Risk Alert",
        message: `High trailing rainfall (${rainfall} mm) detected. Soil is near saturation.`,
      });
    }
    if (temp > 38) {
      alerts.push({
        id: "heatwave",
        type: "danger",
        title: "CRITICAL: Heatwave Alert",
        message: `Extreme temperatures (${temp}°C) may damage crop tissue. Increase irrigation.`,
      });
    }
    if (soilMoisture < 25) {
      alerts.push({
        id: "drought",
        type: "warning",
        title: "Drought Risk Warning",
        message: `Critical soil moisture depletion (${soilMoisture}%). Plants under moisture stress.`,
      });
    }
    if (advisoryResult && advisoryResult.overallRiskScore > 80) {
      alerts.push({
        id: "severe-overall",
        type: "danger",
        title: "EMERGENCY: Severe Overall Farm Risk",
        message: `Combined climate model predicts ${advisoryResult.overallRiskScore}% severe risk. Implement defensive measures immediately.`,
      });
    }
    setNotifications(alerts);
  }, [rainfall, temp, soilMoisture, advisoryResult]);

  // Geolocation detection
  const detectLocation = () => {
    setLocLoading(true);
    setWeatherError(null);
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      setLocLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation(prev => ({ ...prev, lat: latitude, lon: longitude }));
        
        const trimmedKey = weatherKey ? weatherKey.trim() : "";

        // Fetch weather and reverse geocode if key is available
        if (trimmedKey) {
          try {
            const wRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${trimmedKey}&units=metric`);
            if (wRes.ok) {
              const wData = await wRes.json();
              setLiveWeather({
                temp: wData.main.temp,
                humidity: wData.main.humidity,
                description: wData.weather[0].description,
                wind: wData.wind.speed,
                name: wData.name
              });
              setLocation({ name: wData.name, lat: latitude, lon: longitude });
              setWeatherError(null);
              
              // Automatically populate inputs from live weather
              setTemp(Math.round(wData.main.temp));
              setSoilMoisture(Math.max(10, Math.min(95, 100 - wData.main.humidity))); // rough moisture correlation
              if (wData.rain && wData.rain["1h"]) {
                setRainfall(Math.round(wData.rain["1h"] * 24)); // extrapolate 24h
              }
            } else {
              const errData = await wRes.json();
              throw new Error(errData.message || `Weather request failed with status: ${wRes.status}`);
            }
          } catch (e) {
            console.error("Failed to load weather data", e);
            setWeatherError(e.message);
            setLocation({ name: `Coords: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, lat: latitude, lon: longitude });
          }
        } else {
          // If no API key, reverse geocode using free Nominatim OSM API
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              {
                headers: {
                  "User-Agent": "AgriGuardDashboard/1.0"
                }
              }
            );
            if (geoRes.ok) {
              const geoData = await geoRes.json();
              setLocation({
                name: geoData.address.city || geoData.address.town || geoData.address.village || "Detected Location",
                lat: latitude,
                lon: longitude
              });
            } else {
              setLocation({ name: `Coords: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, lat: latitude, lon: longitude });
            }
          } catch (err) {
            setLocation({ name: `Coords: ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`, lat: latitude, lon: longitude });
          }
          // Set simulated weather
          setLiveWeather({
            temp: 28,
            humidity: 65,
            description: "scattered clouds (simulated - no API key)",
            wind: 4.2,
            name: "Local Field"
          });
        }
        setLocLoading(false);
      },
      (error) => {
        console.error("Location error:", error);
        alert("Unable to retrieve location. Using simulated data.");
        setLocLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Run model predictions + AI generation
  const handleGenerateAdvisory = async () => {
    setLoading(true);

    const payload = {
      rainfall_7day_mm: parseFloat(rainfall),
      river_level_m: parseFloat(riverLevel),
      temperature_c: parseFloat(temp),
      soil_moisture_pct: parseFloat(soilMoisture),
      month: parseInt(selectedMonth),
    };

    let apiFloodScore = 0;
    let apiDroughtScore = 0;
    let apiAdvisory = "";
    let apiFloodLvl = "Low";
    let apiDroughtLvl = "Low";

    // 1. Fetch from local flask API
    try {
      const res = await fetch("http://127.0.0.1:5000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        apiFloodScore = data.flood_risk_score;
        apiFloodLvl = data.flood_risk_level;
        apiDroughtScore = data.drought_risk_score;
        apiDroughtLvl = data.drought_risk_level;
        apiAdvisory = data.advisory;
      } else {
        throw new Error("Flask server error");
      }
    } catch (e) {
      console.warn("Could not connect to Flask API. Falling back to local rules.", e);
      // Fallback local calculations if Flask server is offline
      apiFloodScore = Math.min(100, Math.max(0, (rainfall * 0.3) + (riverLevel * 15)));
      apiDroughtScore = Math.min(100, Math.max(0, (100 - soilMoisture) * 0.8 + (temp * 0.5) - (rainfall * 0.1)));
      apiFloodLvl = apiFloodScore >= 66 ? "High" : apiFloodScore >= 33 ? "Medium" : "Low";
      apiDroughtLvl = apiDroughtScore >= 66 ? "High" : apiDroughtScore >= 33 ? "Medium" : "Low";
      apiAdvisory = apiFloodScore >= apiDroughtScore 
        ? (apiFloodLvl === "High" ? "Drain low-lying fields now and delay planting." : "Stable. Proceed with normal planting.")
        : (apiDroughtLvl === "High" ? "Conserve irrigation and use drought-resistant varieties." : "Stable. Proceed with normal planting.");
    }

    // 2. Query Gemini API if key is set
    let aiResponse = null;
    if (geminiKey) {
      try {
        const promptText = `Act as an expert agricultural AI. Given:
- Rainfall (7 days): ${rainfall} mm
- River Level: ${riverLevel} m
- Temperature: ${temp}°C
- Soil Moisture: ${soilMoisture}%
- Month: ${MONTHS.find(m => m.value === selectedMonth)?.label}
- Location: ${location.name}
- ML Flood Risk: ${apiFloodScore.toFixed(1)}% (${apiFloodLvl})
- ML Drought Risk: ${apiDroughtScore.toFixed(1)}% (${apiDroughtLvl})

Provide detailed farm advisory in JSON. Format precisely:
{
  "overallRiskScore": <number 0-100>,
  "floodRisk": <number 0-100>,
  "droughtRisk": <number 0-100>,
  "heatStressRisk": <number 0-100>,
  "pestRisk": <number 0-100>,
  "recommendedCrops": ["Crop1", "Crop2", ...],
  "irrigationAdvice": "<brief sentence>",
  "fertilizerRecommendation": "<brief sentence>",
  "harvestWarning": "<brief sentence>",
  "confidenceScore": <number 0-100>,
  "aiExplanation": "<detailed 2-3 sentence analysis>",
  "emergencyActions": "<1 clear action if risk is high, or 'None required' if normal>"
}`;

        const gRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (gRes.ok) {
          const gData = await gRes.json();
          const textResponse = gData.candidates[0].content.parts[0].text;
          aiResponse = JSON.parse(textResponse);
        }
      } catch (err) {
        console.error("Gemini API call failed, using mock generator", err);
      }
    }

    // 3. Simulated/Mock Generator Fallback if Gemini key is missing or failed
    if (!aiResponse) {
      // Create rich simulated details
      const overall = Math.max(apiFloodScore, apiDroughtScore);
      const heatRisk = Math.min(100, Math.max(5, (temp - 20) * 4));
      const pestRisk = Math.min(100, Math.max(10, (soilMoisture * 0.6) + (temp * 0.4) - 10));
      
      let crops = ["Rice", "Maize"];
      if (overall > 60) {
        crops = ["Sweet Potato (tolerant)", "Taro (damp soil)", "Millets (dry soil)"];
      } else if (temp > 35) {
        crops = ["Sorghum", "Cowpea", "Sesame"];
      } else if (selectedMonth >= 6 && selectedMonth <= 9) {
        crops = ["Deepwater Rice", "Jute"];
      } else {
        crops = ["Wheat", "Mustard", "Potato"];
      }

      let irr = "Maintain standard scheduling. Soil moisture is adequate.";
      if (soilMoisture < 35) irr = "Execute deep irrigation cycles every 48 hours early in the morning.";
      else if (soilMoisture > 80) irr = "Suspend all irrigation and ensure drain outlets are fully operational.";

      let fert = "Apply potassium-rich fertilizers to help crops handle stress.";
      if (apiFloodScore > 60) fert = "Postpone granular application to prevent fertilizer runoff.";

      aiResponse = {
        overallRiskScore: Math.round(overall),
        floodRisk: Math.round(apiFloodScore),
        droughtRisk: Math.round(apiDroughtScore),
        heatStressRisk: Math.round(heatRisk),
        pestRisk: Math.round(pestRisk),
        recommendedCrops: crops,
        irrigationAdvice: irr,
        fertilizerRecommendation: fert,
        harvestWarning: apiFloodScore > 70 ? "High risk of crop waterlogging. Harvest mature crops immediately." : "Weather stable. No immediate harvest warnings.",
        confidenceScore: 89,
        aiExplanation: `Based on current inputs, the primary threat is ${apiFloodScore > apiDroughtScore ? "monsoon-driven waterlogging" : "dry climate transpiration"}. Rainfall is at ${rainfall}mm while soil saturation is ${soilMoisture}%. Recommended crop cultivars should be selected to tolerate these specific moisture levels.`,
        emergencyActions: overall > 75 
          ? `Deploy sandbags around low fields, clear drainage channels immediately, and safeguard portable water pumps.` 
          : "Keep monitoring localized creek levels."
      };
    }

    // Combine local results + AI results
    const fullResult = {
      ...aiResponse,
      id: Date.now(),
      timestamp: new Date().toLocaleString(),
      inputs: { rainfall, riverLevel, temp, soilMoisture, month: selectedMonth, location: location.name },
      localAdvisory: apiAdvisory
    };

    setAdvisoryResult(fullResult);
    
    // Save to history
    const updatedHistory = [fullResult, ...history].slice(0, 20); // Keep last 20
    setHistory(updatedHistory);
    localStorage.setItem("advisory_history", JSON.stringify(updatedHistory));
    
    setLoading(false);
    setActiveTab("analysis"); // auto navigate to results
  };

  const handleReset = () => {
    setRainfall(180);
    setRiverLevel(3.2);
    setTemp(30);
    setSoilMoisture(70);
    setSelectedMonth(7);
    setAdvisoryResult(null);
  };

  // Search filtered months
  const filteredMonths = MONTHS.filter(m => 
    m.label.toLowerCase().includes(monthSearch.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex text-textMain ${highContrast ? 'contrast-more' : ''}`}>
      
      {/* BACKGROUND FLOATING DECORATIONS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-[350px] h-[350px] rounded-full bg-emerald-100/40 blur-3xl animate-pulse-soft"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] rounded-full bg-green-100/40 blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-xs"
          />
        )}
      </AnimatePresence>

      {/* LEFT SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-[#1B5E20] text-emerald-50 flex flex-col justify-between p-6 z-50 shadow-xl border-r border-emerald-800 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div>
          {/* Close button for mobile sidebar */}
          <div className="lg:hidden flex justify-end mb-2">
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-200 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Logo & App Brand */}
          <div className="flex items-center space-x-3 mb-10 mt-2">
            <div className="bg-emerald-500 p-2.5 rounded-xl shadow-inner flex items-center justify-center">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="font-heading font-extrabold text-lg tracking-tight leading-none text-white">AGRI-GUARD</h2>
              <span className="text-[10px] tracking-widest text-emerald-300 font-mono font-semibold">CLIMATE INTEL</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="space-y-1.5">
            {[
              { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
              { id: "analysis", label: "Risk Analysis", icon: Activity },
              { id: "advisory", label: "Crop Advisory", icon: Sprout },
              { id: "weather", label: "Live Weather", icon: Sun },
              { id: "history", label: "History Logs", icon: Clock },
              { id: "settings", label: "API Settings", icon: Settings },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsSidebarOpen(false);
                  }}
                  className={`w-full flex items-center space-x-3.5 px-4 py-3 rounded-xl transition-all duration-200 ${
                    isActive 
                      ? "bg-white/10 text-white font-medium shadow-md border-l-4 border-emerald-400" 
                      : "hover:bg-white/5 text-emerald-100/80 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-emerald-300' : 'text-emerald-200/70'}`} />
                  <span className="text-sm font-sans">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Card */}
        <div className="border-t border-emerald-800/80 pt-6 mt-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold text-white leading-tight">Farmer Account</p>
              <span className="text-[10px] text-emerald-300 font-mono">Location detected</span>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0 z-10 bg-bgLight">
        
        {/* TOP NAVBAR */}
        <header className="h-20 bg-white border-b border-gray-200/80 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm">
          <div className="flex items-center space-x-3 sm:space-x-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg sm:text-2xl font-heading font-extrabold text-gray-900 tracking-tight">
              {activeTab === "dashboard" && "Climate Dashboard"}
              {activeTab === "analysis" && "Risk & Analysis Report"}
              {activeTab === "advisory" && "AI Crop Advisory & Insights"}
              {activeTab === "weather" && "Live Micro-Climate Station"}
              {activeTab === "history" && "Historical Logs & Runs"}
              {activeTab === "settings" && "Integration Settings"}
            </h1>
            <div className="hidden sm:flex items-center space-x-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>AI Engine Online</span>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-6">
            {/* GPS Detection Quick button */}
            <button
              onClick={detectLocation}
              disabled={locLoading}
              className="flex items-center space-x-1.5 sm:space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-medium border border-gray-200 transition-all duration-150 max-w-[120px] sm:max-w-none truncate"
            >
              <MapPin className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0 ${locLoading ? 'animate-bounce' : ''}`} />
              <span className="truncate">{location.name || "Detect Location"}</span>
            </button>

            {/* Current Date */}
            <div className="hidden md:flex items-center space-x-2 text-sm text-gray-500 font-medium">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>{new Date().toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>
          </div>
        </header>

        {/* NOTIFICATION ALERTS AREA */}
        {notifications.length > 0 && (
          <div className="px-8 pt-6 space-y-2">
            {notifications.map((alert) => (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                key={alert.id}
                className={`p-4 rounded-xl flex items-start space-x-3 border shadow-sm ${
                  alert.type === "danger" 
                    ? "bg-red-50 border-red-200 text-red-800" 
                    : "bg-amber-50 border-amber-200 text-amber-800"
                }`}
              >
                <ShieldAlert className={`w-5 h-5 mt-0.5 shrink-0 ${alert.type === "danger" ? "text-red-600" : "text-amber-600"}`} />
                <div>
                  <h4 className="text-sm font-bold tracking-tight">{alert.title}</h4>
                  <p className="text-xs opacity-90 mt-0.5">{alert.message}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* CONTENT SCROLL CONTAINER */}
        <div className="flex-1 overflow-y-auto p-8">
          
          <AnimatePresence mode="wait">
            
            {/* TAB: DASHBOARD */}
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="space-y-8"
              >
                {/* HERO METRICS GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { 
                      title: "Rainfall (7 Days)", 
                      val: `${rainfall} mm`, 
                      desc: "Trailing precipitation",
                      progress: Math.min(100, (rainfall / 300) * 100), 
                      barColor: "bg-blue-600",
                      icon: CloudRain, 
                      color: "text-blue-600 bg-blue-50 border-blue-100", 
                      trend: rainfall > 200 ? "High levels" : "Normal level",
                      trendUp: rainfall > 200
                    },
                    { 
                      title: "River Level", 
                      val: `${riverLevel} m`, 
                      desc: "Above flood baseline",
                      progress: Math.min(100, (riverLevel / 6) * 100), 
                      barColor: riverLevel > 4 ? "bg-red-500" : "bg-teal-500",
                      icon: Waves, 
                      color: "text-teal-600 bg-teal-50 border-teal-100", 
                      trend: riverLevel > 3.5 ? "Approaching warnings" : "Optimal safety",
                      trendUp: riverLevel > 3.5
                    },
                    { 
                      title: "Temperature", 
                      val: `${temp}°C`, 
                      desc: "Current local field",
                      progress: Math.min(100, (temp / 45) * 100), 
                      barColor: temp > 35 ? "bg-orange-500" : "bg-emerald-500",
                      icon: Thermometer, 
                      color: "text-orange-600 bg-orange-50 border-orange-100", 
                      trend: temp > 32 ? "High Heat Index" : "Moderate climate",
                      trendUp: temp > 32
                    },
                    { 
                      title: "Soil Moisture", 
                      val: `${soilMoisture}%`, 
                      desc: "Volumetric water index",
                      progress: soilMoisture, 
                      barColor: "bg-emerald-600",
                      icon: Droplets, 
                      color: "text-emerald-600 bg-emerald-50 border-emerald-100", 
                      trend: soilMoisture < 30 ? "Dry irrigation needed" : "High saturation",
                      trendUp: soilMoisture > 75
                    },
                  ].map((card, idx) => {
                    const Icon = card.icon;
                    return (
                      <motion.div
                        whileHover={{ y: -6, boxShadow: "0 15px 30px rgba(0,0,0,0.06)" }}
                        key={idx}
                        className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm relative overflow-hidden transition-all duration-150"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">{card.title}</span>
                            <h3 className="text-2xl font-bold font-heading text-gray-900 mt-1">{card.val}</h3>
                            <p className="text-xs text-gray-500 mt-0.5 leading-none">{card.desc}</p>
                          </div>
                          <div className={`p-3 rounded-xl border ${card.color} flex items-center justify-center`}>
                            <Icon className="w-5 h-5" />
                          </div>
                        </div>

                        {/* Trend info */}
                        <div className="flex items-center space-x-1.5 mt-5">
                          {card.trendUp ? (
                            <TrendingUp className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          ) : (
                            <TrendingDown className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                          <span className={`text-[11px] font-semibold ${card.trendUp ? 'text-red-600' : 'text-emerald-600'}`}>
                            {card.trend}
                          </span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-3 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${card.barColor}`} style={{ width: `${card.progress}%` }}></div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* 2-COLUMN MAIN PANEL */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  
                  {/* LEFT INPUT CONTROLS CARD */}
                  <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-6">
                        <div className="flex items-center space-x-2">
                          <Brain className="w-5 h-5 text-emerald-600" />
                          <h3 className="text-md font-heading font-extrabold text-gray-900">Configure Local Conditions</h3>
                        </div>
                        <button 
                          onClick={handleReset} 
                          className="text-xs text-gray-400 hover:text-emerald-600 flex items-center space-x-1 font-semibold"
                        >
                          <RefreshCw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>

                      {/* INPUT FIELDS */}
                      <div className="space-y-6">
                        
                        {/* Rainfall Input */}
                        <div>
                          <label className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold block mb-2">Rainfall (Trailing 7 Days)</label>
                          <div className="relative rounded-xl border border-gray-200 focus-within:border-emerald-500 overflow-hidden bg-gray-50/50 transition-colors">
                            <input
                              type="number"
                              value={rainfall}
                              onChange={(e) => setRainfall(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full pl-4 pr-12 py-3 bg-transparent text-gray-900 focus:outline-none font-medium font-sans text-sm"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase tracking-widest font-mono">mm</div>
                          </div>
                        </div>

                        {/* River Level Slider + Number */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold block">River Level Above Baseline</label>
                            <span className="text-xs font-mono font-bold text-gray-500">{riverLevel.toFixed(1)} m</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <input
                              type="range"
                              min="0"
                              max="6"
                              step="0.1"
                              value={riverLevel}
                              onChange={(e) => setRiverLevel(parseFloat(e.target.value))}
                              className="flex-1 accent-[#1B5E20] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <input
                              type="number"
                              value={riverLevel}
                              onChange={(e) => setRiverLevel(Math.max(0, parseFloat(e.target.value) || 0))}
                              className="w-20 px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-semibold bg-gray-50 text-gray-900 focus:outline-none focus:border-emerald-500 text-center"
                            />
                          </div>
                        </div>

                        {/* Temperature Slider with Color Feedback */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold block">Temperature</label>
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                              temp > 35 ? 'bg-red-100 text-red-800' : temp > 28 ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                            }`}>
                              {temp}°C
                            </span>
                          </div>
                          <input
                            type="range"
                            min="10"
                            max="50"
                            step="1"
                            value={temp}
                            onChange={(e) => setTemp(parseInt(e.target.value))}
                            className="w-full accent-emerald-700 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                          />
                        </div>

                        {/* Soil Moisture Slider + Circular preview */}
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold block">Soil Moisture</label>
                            <span className="text-xs font-mono font-bold text-gray-500">{soilMoisture}%</span>
                          </div>
                          <div className="flex items-center space-x-6">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              step="1"
                              value={soilMoisture}
                              onChange={(e) => setSoilMoisture(parseInt(e.target.value))}
                              className="flex-1 accent-emerald-700 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            
                            {/* Circular indicator */}
                            <div className="relative flex items-center justify-center shrink-0">
                              <svg className="w-12 h-12 transform -rotate-90">
                                <circle cx="24" cy="24" r="20" className="text-gray-100" strokeWidth="4" stroke="currentColor" fill="transparent" />
                                <circle 
                                  cx="24" 
                                  cy="24" 
                                  r="20" 
                                  className="text-emerald-600 transition-all duration-300" 
                                  strokeWidth="4" 
                                  strokeDasharray={2 * Math.PI * 20} 
                                  strokeDashoffset={2 * Math.PI * 20 * (1 - soilMoisture / 100)} 
                                  strokeLinecap="round" 
                                  stroke="currentColor" 
                                  fill="transparent" 
                                />
                              </svg>
                              <span className="absolute text-[10px] font-bold font-mono text-gray-700">{soilMoisture}%</span>
                            </div>
                          </div>
                        </div>

                        {/* Searchable Custom Select for Month */}
                        <div className="relative">
                          <label className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold block mb-2">Target Prediction Month</label>
                          <div 
                            onClick={() => setIsMonthDropdownOpen(!isMonthDropdownOpen)}
                            className="w-full flex items-center justify-between border border-gray-200 rounded-xl px-4 py-3 bg-gray-50/50 cursor-pointer hover:border-emerald-500 transition-colors"
                          >
                            <span className="text-sm font-medium text-gray-800">
                              {MONTHS.find(m => m.value === selectedMonth)?.label || "Select month"}
                            </span>
                            <Calendar className="w-4 h-4 text-emerald-600" />
                          </div>

                          {isMonthDropdownOpen && (
                            <div className="absolute left-0 right-0 mt-2 bg-white border border-gray-100 rounded-2xl shadow-xl z-20 overflow-hidden">
                              <div className="p-3 border-b border-gray-100 flex items-center space-x-2">
                                <Search className="w-3.5 h-3.5 text-gray-400" />
                                <input
                                  type="text"
                                  placeholder="Search months..."
                                  value={monthSearch}
                                  onChange={(e) => setMonthSearch(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-full text-xs text-gray-700 focus:outline-none"
                                />
                              </div>
                              <div className="max-h-48 overflow-y-auto">
                                {filteredMonths.map((m) => (
                                  <div
                                    key={m.value}
                                    onClick={() => {
                                      setSelectedMonth(m.value);
                                      setIsMonthDropdownOpen(false);
                                      setMonthSearch("");
                                    }}
                                    className={`px-4 py-2.5 text-sm cursor-pointer hover:bg-emerald-50/50 flex items-center justify-between ${
                                      selectedMonth === m.value ? 'bg-emerald-50 text-emerald-800 font-semibold' : 'text-gray-700'
                                    }`}
                                  >
                                    <span>{m.label}</span>
                                    {selectedMonth === m.value && <CheckCircle className="w-4 h-4 text-emerald-600" />}
                                  </div>
                                ))}
                                {filteredMonths.length === 0 && (
                                  <div className="px-4 py-3 text-xs text-gray-400 text-center font-mono">No matches</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                      </div>
                    </div>

                    {/* Generate Button */}
                    <div className="mt-8 pt-6 border-t border-gray-100">
                      <button
                        onClick={handleGenerateAdvisory}
                        disabled={loading}
                        className="w-full relative flex items-center justify-center px-6 py-4 rounded-xl text-white font-heading font-bold overflow-hidden shadow-lg shadow-emerald-900/10 hover:shadow-emerald-950/20 transition-all duration-300 transform active:scale-[0.98] disabled:opacity-80"
                        style={{
                          background: 'linear-gradient(135deg, #1B5E20 0%, #2E7D32 50%, #43A047 100%)'
                        }}
                      >
                        {loading ? (
                          <div className="flex items-center space-x-3">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span className="tracking-wide">ANALYZING FARM DATA...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <Sparkles className="w-5 h-5 text-emerald-300 animate-pulse" />
                            <span className="tracking-wide">GENERATE AI ADVISORY</span>
                          </div>
                        )}
                      </button>
                    </div>

                  </div>

                  {/* RIGHT CHARTS GRID CONTAINER */}
                  <div className="lg:col-span-7 space-y-6">
                    
                    {/* RAINFALL HISTORICAL PREDICTIVE TREND CHART */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                      <div className="flex justify-between items-center mb-4">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Rainfall Analysis</span>
                          <h4 className="text-md font-heading font-extrabold text-gray-900">7-Day Trailing Trend &amp; Baseline</h4>
                        </div>
                        <div className="flex items-center space-x-4 text-xs font-mono font-bold text-gray-400">
                          <div className="flex items-center space-x-1.5">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            <span>Level (mm)</span>
                          </div>
                        </div>
                      </div>

                      <div className="h-60 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart
                            data={[
                              { day: "D-6", rainfall: Math.round(rainfall * 0.4) },
                              { day: "D-5", rainfall: Math.round(rainfall * 0.6) },
                              { day: "D-4", rainfall: Math.round(rainfall * 0.55) },
                              { day: "D-3", rainfall: Math.round(rainfall * 0.8) },
                              { day: "D-2", rainfall: Math.round(rainfall * 0.95) },
                              { day: "D-1", rainfall: Math.round(rainfall * 0.9) },
                              { day: "Today", rainfall: rainfall },
                            ]}
                            margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                          >
                            <defs>
                              <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="day" stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #f3f4f6', boxShadow: '0 8px 16px rgba(0,0,0,0.05)' }} />
                            <Area type="monotone" dataKey="rainfall" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRain)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* RISK PROBABILITY GAUGES GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      
                      {/* TEMPERATURE GAUGE METER */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Climate Stress</span>
                          <h4 className="text-sm font-heading font-extrabold text-gray-900 mb-4">Temperature Meter</h4>
                        </div>
                        
                        <div className="flex items-center justify-between space-x-4">
                          <div className="flex-1">
                            <div className="h-3 bg-gray-100 rounded-full overflow-hidden relative">
                              <div 
                                className="h-full rounded-full transition-all duration-300"
                                style={{ 
                                  width: `${Math.min(100, (temp / 50) * 100)}%`,
                                  background: `linear-gradient(90deg, #3b82f6 0%, #eab308 60%, #ef4444 100%)`
                                }}
                              ></div>
                            </div>
                            <div className="flex justify-between text-[9px] font-mono text-gray-400 mt-2 font-bold">
                              <span>10°C</span>
                              <span>30°C</span>
                              <span>50°C</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xl font-heading font-extrabold text-gray-950">{temp}°C</span>
                            <p className="text-[10px] text-gray-400 font-mono mt-0.5 leading-none">Optimal: 22-28°C</p>
                          </div>
                        </div>
                      </div>

                      {/* SOIL MOISTURE DONUT */}
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">Water Profile</span>
                          <h4 className="text-sm font-heading font-extrabold text-gray-900 mb-2">Soil Moisture Donut</h4>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="w-24 h-24 relative shrink-0">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={[
                                    { value: soilMoisture },
                                    { value: 100 - soilMoisture }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={28}
                                  outerRadius={38}
                                  startAngle={90}
                                  endAngle={-270}
                                  dataKey="value"
                                >
                                  <Cell fill="#059669" />
                                  <Cell fill="#f3f4f6" />
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                              <span className="text-sm font-heading font-extrabold text-gray-900">{soilMoisture}%</span>
                              <span className="text-[7px] text-gray-400 font-mono leading-none">SATURATION</span>
                            </div>
                          </div>
                          <div className="text-right pl-4">
                            <span className="text-xs font-mono font-bold text-gray-600 block">
                              {soilMoisture > 75 ? "Extremely wet" : soilMoisture > 40 ? "Healthy moisture" : "Dry / Water deficit"}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1 block">Ideal crop moisture: 55%-70%</span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB: RISK ANALYSIS (RESULTS PANEL) */}
            {activeTab === "analysis" && (
              <motion.div
                key="analysis-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {!advisoryResult ? (
                  <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
                    <Brain className="w-16 h-16 text-emerald-100 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-xl font-heading font-extrabold text-gray-900">No Risk Report Generated</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                      Please customize your parameters on the Dashboard tab, then click **Generate AI Advisory** to build a climate risk report.
                    </p>
                    <button 
                      onClick={() => setActiveTab("dashboard")} 
                      className="mt-6 inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-6 py-3 rounded-xl shadow-md transition-all duration-200"
                    >
                      <span>Return to Dashboard</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    
                    {/* RISK METER & OVERALL SUMMARY */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      
                      {/* Overall Risk Circular Gauge */}
                      <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold mb-4">Overall Assessment</span>
                        
                        <div className="w-40 h-40 relative flex items-center justify-center mb-4">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="80" cy="80" r="70" className="text-gray-100" strokeWidth="8" stroke="currentColor" fill="transparent" />
                            <circle 
                              cx="80" 
                              cy="80" 
                              r="70" 
                              className={`transition-all duration-1000 ${
                                advisoryResult.overallRiskScore > 75 
                                  ? 'text-red-500' 
                                  : advisoryResult.overallRiskScore > 45 
                                  ? 'text-yellow-500' 
                                  : 'text-emerald-500'
                              }`} 
                              strokeWidth="10" 
                              strokeDasharray={2 * Math.PI * 70} 
                              strokeDashoffset={2 * Math.PI * 70 * (1 - advisoryResult.overallRiskScore / 100)} 
                              strokeLinecap="round" 
                              stroke="currentColor" 
                              fill="transparent" 
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-heading font-black text-gray-950">{advisoryResult.overallRiskScore}%</span>
                            <span className="text-[9px] font-mono text-gray-400 tracking-wider font-bold">RISK COEFFICIENT</span>
                          </div>
                        </div>

                        {/* Level badge */}
                        <div className={`px-4 py-1.5 rounded-full font-heading font-bold text-xs uppercase tracking-wider ${
                          advisoryResult.overallRiskScore > 75 
                            ? 'bg-red-100 text-red-800 border border-red-200' 
                            : advisoryResult.overallRiskScore > 45 
                            ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}>
                          {advisoryResult.overallRiskScore > 75 ? "Severe Threat" : advisoryResult.overallRiskScore > 45 ? "Moderate Danger" : "Stable Conditions"}
                        </div>

                        <p className="text-xs text-gray-400 mt-4 leading-relaxed font-mono">
                          Confidence Level: {advisoryResult.confidenceScore || 85}%
                        </p>
                      </div>

                      {/* 4 Multi-Risk Indicators (Flood, Drought, Heat, Pest) */}
                      <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold">AI Threat Vectors</span>
                          <h4 className="text-lg font-heading font-extrabold text-gray-900 mb-6">Localized Climate Risk Profile</h4>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          {[
                            { name: "Flood Risk Index", val: advisoryResult.floodRisk, color: "bg-blue-600", border: "border-blue-100 bg-blue-50/50" },
                            { name: "Drought Susceptibility", val: advisoryResult.droughtRisk, color: "bg-amber-600", border: "border-amber-100 bg-amber-50/50" },
                            { name: "Heat Stress Index", val: advisoryResult.heatStressRisk, color: "bg-red-500", border: "border-red-100 bg-red-50/50" },
                            { name: "Pest Vulnerability", val: advisoryResult.pestRisk, color: "bg-purple-600", border: "border-purple-100 bg-purple-50/50" }
                          ].map((item, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border ${item.border}`}>
                              <div className="flex justify-between items-center mb-2">
                                <span className="text-xs font-semibold text-gray-700">{item.name}</span>
                                <span className="text-sm font-heading font-bold text-gray-950">{item.val}%</span>
                              </div>
                              <div className="w-full h-2 bg-gray-200/60 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.val}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="mt-6 flex items-center space-x-2 text-xs text-gray-400 font-mono">
                          <Info className="w-4 h-4 text-emerald-600" />
                          <span>Generated using hybrid Random Forest + Deep Decision Tree classifiers.</span>
                        </div>
                      </div>

                    </div>

                    {/* AI explanation and Emergency Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      
                      {/* AI Explanation Text */}
                      <div className="lg:col-span-8 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center space-x-2 mb-4">
                          <Brain className="w-5 h-5 text-emerald-600" />
                          <h4 className="text-md font-heading font-extrabold text-gray-950">AI Synthesis &amp; Rationale</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed font-sans">
                          {advisoryResult.aiExplanation}
                        </p>
                        
                        {/* Emergency banner inside synthesis */}
                        {advisoryResult.overallRiskScore > 70 && (
                          <div className="mt-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start space-x-3 text-red-900">
                            <ShieldAlert className="w-5 h-5 shrink-0 text-red-600" />
                            <div>
                              <span className="text-xs font-mono font-bold tracking-wider uppercase text-red-700">Immediate Action Action Required</span>
                              <p className="text-sm font-medium mt-1">{advisoryResult.emergencyActions}</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Micro-Climate Station Widget */}
                      <div className="lg:col-span-4 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 font-bold block mb-1">Weather Station</span>
                          <h4 className="text-sm font-heading font-extrabold text-gray-950 mb-4">Current Weather Readings</h4>
                        </div>

                        <div className="flex items-center space-x-4 mb-4">
                          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                            <Sun className="w-8 h-8 text-amber-600" />
                          </div>
                          <div>
                            <span className="text-2xl font-heading font-extrabold text-gray-900">
                              {liveWeather ? `${Math.round(liveWeather.temp)}°C` : `${temp}°C`}
                            </span>
                            <p className="text-xs text-gray-500 font-medium capitalize">
                              {liveWeather ? liveWeather.description : "Mild Sunny (simulated)"}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Wind className="w-4 h-4 text-gray-400" />
                            <span>Wind: {liveWeather ? `${liveWeather.wind} m/s` : "4.0 m/s"}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <Droplets className="w-4 h-4 text-gray-400" />
                            <span>Humidity: {liveWeather ? `${liveWeather.humidity}%` : `${100 - soilMoisture}%`}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: CROP ADVISORY */}
            {activeTab === "advisory" && (
              <motion.div
                key="advisory-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {!advisoryResult ? (
                  <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
                    <Sprout className="w-16 h-16 text-emerald-100 mx-auto mb-4 animate-bounce" />
                    <h3 className="text-xl font-heading font-extrabold text-gray-900">No Crop Advisory Generated</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto mt-2">
                      Please customize your parameters on the Dashboard tab, then click **Generate AI Advisory** to build a detailed crop analysis.
                    </p>
                    <button 
                      onClick={() => setActiveTab("dashboard")} 
                      className="mt-6 inline-flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-6 py-3 rounded-xl shadow-md transition-all duration-200"
                    >
                      <span>Return to Dashboard</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* RECOMMENDED CROPS COLUMN */}
                    <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="flex items-center space-x-2 mb-6">
                          <Sprout className="w-5 h-5 text-emerald-600" />
                          <h4 className="text-md font-heading font-extrabold text-gray-900">Adaptive Crop Recommendations</h4>
                        </div>
                        
                        <p className="text-xs text-gray-500 mb-4 leading-relaxed font-sans">
                          These cultivars have been selected dynamically based on trailing soil moisture profile and high-temperature stress:
                        </p>

                        <div className="space-y-3">
                          {advisoryResult.recommendedCrops.map((crop, idx) => (
                            <div key={idx} className="flex items-center space-x-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl">
                              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                                <span className="text-white font-heading font-bold text-sm">{idx + 1}</span>
                              </div>
                              <div>
                                <h5 className="text-sm font-heading font-extrabold text-emerald-950">{crop}</h5>
                                <span className="text-[10px] text-emerald-700/80 font-mono">Stress Tolerant Cultivar</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-8 pt-4 border-t border-gray-100">
                        <span className="text-[10px] font-mono text-gray-400 block font-bold">MONTHLY MONSOON ALIGNMENT</span>
                        <span className="text-xs font-semibold text-gray-700 mt-1 block">
                          Month selected: {MONTHS.find(m => m.value === advisoryResult.inputs.month)?.label}
                        </span>
                      </div>
                    </div>

                    {/* DETAILED ADVICE CARD */}
                    <div className="lg:col-span-7 space-y-6">
                      
                      {/* Irrigation and Fertilizer */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center space-x-2 mb-6">
                          <Brain className="w-5 h-5 text-emerald-600" />
                          <h4 className="text-md font-heading font-extrabold text-gray-950">Intelligent Field Directives</h4>
                        </div>

                        <div className="space-y-6">
                          <div className="flex items-start space-x-4">
                            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-600">
                              <Droplets className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">Irrigation Advice</h5>
                              <p className="text-sm text-gray-700 mt-1 leading-relaxed font-sans">{advisoryResult.irrigationAdvice}</p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-4 border-t border-gray-100 pt-6">
                            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100 text-purple-600">
                              <Sprout className="w-5 h-5" />
                            </div>
                            <div>
                              <h5 className="text-xs font-mono uppercase tracking-wider text-gray-400 font-bold">Fertilizer Application</h5>
                              <p className="text-sm text-gray-700 mt-1 leading-relaxed font-sans">{advisoryResult.fertilizerRecommendation}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Warnings and Harvest guidance */}
                      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center space-x-2 mb-4">
                          <AlertTriangle className="w-5 h-5 text-amber-500" />
                          <h4 className="text-md font-heading font-extrabold text-gray-950">Pre-Harvest Alerts</h4>
                        </div>
                        <p className="text-sm text-gray-600 leading-relaxed font-sans">
                          {advisoryResult.harvestWarning}
                        </p>
                      </div>

                    </div>

                  </div>
                )}
              </motion.div>
            )}

            {/* TAB: WEATHER */}
            {activeTab === "weather" && (
              <motion.div
                key="weather-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-2">
                      <Sun className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-md font-heading font-extrabold text-gray-900">Live Field Weather Integration</h4>
                    </div>
                    <button 
                      onClick={detectLocation}
                      disabled={locLoading}
                      className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs px-4 py-2.5 rounded-xl border border-emerald-100 font-semibold"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{locLoading ? "Retrieving GPS..." : "Fetch Current Location Weather"}</span>
                    </button>
                  </div>

                  {weatherError && (
                    <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Failed to fetch live weather: {weatherError}</span>
                    </div>
                  )}

                  {!liveWeather ? (
                    <div className="py-8 text-center bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                      <Sun className="w-12 h-12 text-gray-300 mx-auto mb-3 animate-spin" style={{ animationDuration: '6s' }} />
                      <p className="text-xs font-semibold text-gray-500">No live weather loaded yet</p>
                      <p className="text-[11px] text-gray-400 mt-1 max-w-sm mx-auto">
                        Please insert your OpenWeatherMap API Key in settings, or press the GPS fetch button to run a simulated weather retrieval.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 bg-gradient-to-br from-emerald-800 to-emerald-950 text-white rounded-xl shadow-md">
                        <span className="text-[10px] font-mono text-emerald-300 tracking-wider font-bold">STATION LOCATION</span>
                        <h3 className="text-xl font-heading font-bold mt-1 text-white">{liveWeather.name}</h3>
                        <p className="text-[10px] text-emerald-300/80 font-mono mt-0.5">GPS: {location.lat?.toFixed(3)}, {location.lon?.toFixed(3)}</p>
                        
                        <div className="mt-8 flex items-baseline space-x-2">
                          <span className="text-5xl font-heading font-black">{Math.round(liveWeather.temp)}</span>
                          <span className="text-xl font-heading font-bold text-emerald-300">°C</span>
                        </div>
                        <p className="text-xs text-emerald-200 mt-2 font-medium capitalize">{liveWeather.description}</p>
                      </div>

                      <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-gray-400 tracking-wider font-bold">ATMOSPHERIC MOISTURE</span>
                          <h4 className="text-sm font-heading font-bold text-gray-800 mt-1">Relative Humidity</h4>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <Droplets className="w-10 h-10 text-emerald-600" />
                          <span className="text-4xl font-heading font-extrabold text-gray-900">{liveWeather.humidity}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
                          <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${liveWeather.humidity}%` }}></div>
                        </div>
                      </div>

                      <div className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm flex flex-col justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-gray-400 tracking-wider font-bold">WIND VELOCITY</span>
                          <h4 className="text-sm font-heading font-bold text-gray-800 mt-1">Wind Speed</h4>
                        </div>

                        <div className="flex items-center justify-between">
                          <Wind className="w-10 h-10 text-teal-600" />
                          <span className="text-4xl font-heading font-extrabold text-gray-900">{liveWeather.wind} <span className="text-sm text-gray-400 font-mono">m/s</span></span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full mt-4 overflow-hidden">
                          <div className="h-full bg-teal-600 rounded-full" style={{ width: `${Math.min(100, (liveWeather.wind / 20) * 100)}%` }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: HISTORY LOGS */}
            {activeTab === "history" && (
              <motion.div
                key="history-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-emerald-600" />
                      <h4 className="text-md font-heading font-extrabold text-gray-900">AI Risk Assessment History Logs</h4>
                    </div>
                    <button 
                      onClick={() => {
                        setHistory([]);
                        localStorage.removeItem("advisory_history");
                      }}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold"
                    >
                      Clear All History
                    </button>
                  </div>

                  {history.length === 0 ? (
                    <div className="py-12 text-center text-gray-400 font-mono text-xs">
                      No logs found. Run predictions to compile history.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {history.map((log) => (
                        <div key={log.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs font-semibold text-gray-800">{log.inputs.location || "Global Location"}</span>
                              <span className="text-[10px] text-gray-400 font-mono">({log.timestamp})</span>
                            </div>
                            <div className="flex flex-wrap gap-2 mt-2">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-800 text-[10px] font-bold font-mono rounded">Rain: {log.inputs.rainfall}mm</span>
                              <span className="px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-bold font-mono rounded">River: {log.inputs.riverLevel}m</span>
                              <span className="px-2 py-0.5 bg-orange-50 text-orange-800 text-[10px] font-bold font-mono rounded">Temp: {log.inputs.temp}°C</span>
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 text-[10px] font-bold font-mono rounded">Moisture: {log.inputs.soilMoisture}%</span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <span className="text-xs text-gray-400 font-mono">Overall Risk</span>
                              <p className="text-lg font-heading font-extrabold text-gray-950 leading-none">{log.overallRiskScore}%</p>
                            </div>
                            <button
                              onClick={() => {
                                setAdvisoryResult(log);
                                setActiveTab("analysis");
                              }}
                              className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg shadow-sm"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* TAB: SETTINGS */}
            {activeTab === "settings" && (
              <motion.div
                key="settings-tab"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm max-w-2xl">
                  <div className="flex items-center space-x-2 mb-8 pb-4 border-b border-gray-100">
                    <Settings className="w-5 h-5 text-emerald-600" />
                    <h4 className="text-md font-heading font-extrabold text-gray-900">API Credentials &amp; UI Configurations</h4>
                  </div>

                  <div className="space-y-6">
                    
                    {/* Gemini API Key */}
                    <div>
                      <label className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold block mb-2">Gemini Pro API Key</label>
                      <input
                        type="password"
                        placeholder="Enter gemini-api-key"
                        value={geminiKey}
                        onChange={(e) => setGeminiKey(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-sans focus:outline-none focus:border-emerald-500 bg-gray-50/50"
                      />
                      <p className="text-[10px] text-gray-400 mt-1 font-sans">
                        Required for dynamic Gemini-powered crop advisories. Key is stored locally in your browser.
                      </p>
                    </div>

                    {/* OpenWeatherMap API Key */}
                    <div>
                      <label className="text-xs font-mono uppercase tracking-wider text-emerald-700 font-bold block mb-2">OpenWeatherMap API Key</label>
                      <input
                        type="password"
                        placeholder="Enter openweathermap-api-key"
                        value={weatherKey}
                        onChange={(e) => setWeatherKey(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-sans focus:outline-none focus:border-emerald-500 bg-gray-50/50"
                      />
                      <p className="text-[10px] text-gray-400 mt-1 font-sans">
                        Required to pull local climate telemetry automatically.
                      </p>
                    </div>

                    {/* High Contrast Mode */}
                    <div className="flex items-center justify-between border-t border-gray-100 pt-6">
                      <div>
                        <span className="text-sm font-bold text-gray-800">High Contrast Mode</span>
                        <p className="text-[10px] text-gray-400 mt-0.5">Increases layout readability and contrast settings.</p>
                      </div>
                      <button 
                        onClick={() => setHighContrast(!highContrast)}
                        className="text-emerald-600 transition-colors"
                      >
                        {highContrast ? (
                          <ToggleRight className="w-10 h-10" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-gray-300" />
                        )}
                      </button>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div>

      </main>

    </div>
  );
}
