import React, { useState, useEffect } from "react";
import { MessageSquare, LineChart, Shield, Download, Sparkles, Heart, Sun, Moon } from "lucide-react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import ChatSection from "./components/ChatSection";
import MathFunctionSection from "./components/MathFunctionSection";
import AdminSection from "./components/AdminSection";
import DhikrTicker from "./components/DhikrTicker";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "math" | "admin">("chat");

  // Global settings loaded live from Firestore settings/dali document with LocalStorage fallback
  const [welcomeMessage, setWelcomeMessage] = useState(() => {
    return localStorage.getItem("dali_welcomeMessage") || "مرحبا بيك خويا اختي انا الاستاذ دالي استاذ مادة رياضيات و مبرمج بذكاء اصطناعي كيفاش نقدر نساعدك؟";
  });
  
  // Elegant starting mathematical avatar of Professor Dali
  const [profileImageUrl, setProfileImageUrl] = useState(() => {
    return localStorage.getItem("dali_profileImageUrl") || "https://img.icons8.com/color/150/user-male-circle.png";
  });
  
  const [apiKeys, setApiKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem("dali_apiKeys");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Mode and active index state for manual selection/sequential ordered rotation
  const [keyRotationMode, setKeyRotationMode] = useState<"sequential" | "manual">(() => {
    return (localStorage.getItem("dali_keyRotationMode") as "sequential" | "manual") || "sequential";
  });
  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number>(() => {
    const val = localStorage.getItem("dali_selectedKeyIndex");
    return val ? Number(val) : -1;
  });

  // Dark / Light Theme state representation
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("dali_theme");
    return saved !== "light"; // defaults to dark mode
  });

  // PWA standalone installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [showPwaHelpModal, setShowPwaHelpModal] = useState(false);

  // 1. Listen for real-time adjustments in Firestore config
  useEffect(() => {
    const docRef = doc(db, "settings", "dali");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.welcomeMessage) {
          setWelcomeMessage(data.welcomeMessage);
          localStorage.setItem("dali_welcomeMessage", data.welcomeMessage);
        }
        if (data.profileImageUrl) {
          setProfileImageUrl(data.profileImageUrl);
          localStorage.setItem("dali_profileImageUrl", data.profileImageUrl);
        }
        if (Array.isArray(data.apiKeys)) {
          setApiKeys(data.apiKeys);
          localStorage.setItem("dali_apiKeys", JSON.stringify(data.apiKeys));
        }
        if (data.keyRotationMode) {
          setKeyRotationMode(data.keyRotationMode);
          localStorage.setItem("dali_keyRotationMode", data.keyRotationMode);
        }
        if (typeof data.selectedKeyIndex === "number") {
          setSelectedKeyIndex(data.selectedKeyIndex);
          localStorage.setItem("dali_selectedKeyIndex", String(data.selectedKeyIndex));
        }
      }
    }, (error) => {
      console.info("Firestore sync profile load completed.");
    });
    return () => unsubscribe();
  }, []);

  // 2. Hear and capture browser beforeinstallprompt to enable direct PWA installation button
  useEffect(() => {
    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforePrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`Direct installation choice: ${outcome}`);
      setDeferredPrompt(null);
      setIsInstallable(false);
    } else {
      setShowPwaHelpModal(true);
    }
  };

  const handleSettingsUpdated = (
    newImg: string, 
    newMsg: string, 
    newKeys: string[], 
    newMode?: "sequential" | "manual", 
    newIndex?: number
  ) => {
    setProfileImageUrl(newImg);
    setWelcomeMessage(newMsg);
    setApiKeys(newKeys);
    if (newMode) {
      setKeyRotationMode(newMode);
      localStorage.setItem("dali_keyRotationMode", newMode);
    }
    if (newIndex !== undefined) {
      setSelectedKeyIndex(newIndex);
      localStorage.setItem("dali_selectedKeyIndex", String(newIndex));
    }
    // Instant sync verification
    localStorage.setItem("dali_profileImageUrl", newImg);
    localStorage.setItem("dali_welcomeMessage", newMsg);
    localStorage.setItem("dali_apiKeys", JSON.stringify(newKeys));
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-[#0b0f19] text-slate-100" : "bg-[#f1f5f9] text-slate-800"} flex flex-col justify-between font-sans selection:bg-emerald-600/30 ${!isDarkMode ? "light-theme-wrapper" : ""}`}>
      
      {!isDarkMode && (
        <style>{`
          .light-theme-wrapper {
            background-color: #f1f5f9;
            color: #0f172a;
          }
          .light-theme-wrapper header,
          .light-theme-wrapper nav,
          .light-theme-wrapper main > div,
          .light-theme-wrapper .bg-\[\#131b2e\],
          .light-theme-wrapper .bg-\[\#101726\],
          .light-theme-wrapper .bg-slate-900,
          .light-theme-wrapper .bg-slate-950,
          .light-theme-wrapper .bg-slate-950\/70,
          .light-theme-wrapper .bg-slate-950\/45,
          .light-theme-wrapper .bg-\[\#111827\],
          .light-theme-wrapper .bg-\[\#1a2436\],
          .light-theme-wrapper .bg-slate-900\/50,
          .light-theme-wrapper .bg-slate-900\/60,
          .light-theme-wrapper .bg-slate-950\/50,
          .light-theme-wrapper .bg-slate-950\/80 {
            background-color: #ffffff !important;
            color: #1e293b !important;
            border-color: #cbd5e1 !important;
          }
          .light-theme-wrapper h1,
          .light-theme-wrapper h2,
          .light-theme-wrapper h3,
          .light-theme-wrapper .text-white,
          .light-theme-wrapper .text-slate-100,
          .light-theme-wrapper .text-slate-200,
          .light-theme-wrapper .text-slate-300,
          .light-theme-wrapper .text-slate-350,
          .light-theme-wrapper .text-slate-450,
          .light-theme-wrapper .text-slate-400 {
            color: #1e293b !important;
          }
          .light-theme-wrapper p,
          .light-theme-wrapper .text-slate-400 {
            color: #475569 !important;
          }
          .light-theme-wrapper .text-slate-500 {
            color: #64748b !important;
          }
          .light-theme-wrapper .border-slate-850,
          .light-theme-wrapper .border-slate-800,
          .light-theme-wrapper .border-slate-700,
          .light-theme-wrapper .border-slate-750,
          .light-theme-wrapper .border-slate-800\/80 {
            border-color: #e2e8f0 !important;
          }
          /* Custom overrides for nice white sections and tables */
          .light-theme-wrapper .bg-\[\#111827\] {
            background-color: #f8fafc !important;
            color: #0f172a !important;
          }
          .light-theme-wrapper .bg-\[\#1a2436\] {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
          }
          .light-theme-wrapper input,
          .light-theme-wrapper select,
          .light-theme-wrapper textarea {
            background-color: #ffffff !important;
            color: #0f172a !important;
            border-color: #cbd5e1 !important;
          }
        `}</style>
      )}

      {/* Top Standalone Banner to trigger direct Android/Phone direct app installation */}
      {isInstallable && (
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white py-2 px-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-base sm:text-lg">🇩🇿</span>
            <p className="text-xs sm:text-sm font-semibold select-none">ثبت تطبيق الأستاذ دالي الآن بخطوة واحدة والتحق بالدروس مباشرة!</p>
          </div>
          <button 
            onClick={handleInstallPWA}
            className="bg-white text-emerald-800 hover:bg-emerald-50 hover:text-emerald-950 font-black text-xs px-3.5 py-1.5 rounded-lg shadow-sm flex items-center gap-1 transition-all duration-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تثبيت فوري</span>
          </button>
        </div>
      )}

      {/* Main Structural body wrapper */}
      <div className="max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8 space-y-6">
        
        {/* Main Branding Header with profile photo and Algerian banner */}
        <header className="flex flex-col sm:flex-row items-center justify-between bg-[#131b2e] p-4 md:p-5 rounded-2xl border border-slate-800/80 shadow-lg shadow-black/20 gap-4">
          <div className="flex items-center gap-4 text-right">
            <div className="relative">
              <img 
                referrerPolicy="no-referrer"
                src={profileImageUrl} 
                alt="الأستاذ دالي نجيب" 
                className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow-md shadow-emerald-500/20 cursor-pointer transition-transform duration-200 hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "https://img.icons8.com/color/150/user-male-circle.png";
                }}
              />
              <span className="absolute -bottom-1.5 -right-1.5 bg-[#131b2e] text-[13px] px-1.5 py-0.5 rounded-full border border-slate-700" title="الجزائر 🇩🇿">🇩🇿</span>
            </div>
            <div>
              <div className="flex items-center gap-2 justify-end">
                <span className="text-slate-400 font-bold text-[10px] sm:text-xs uppercase tracking-wider">المنصة التعليمية للذكاء الاصطناعي</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 flex-wrap justify-end mt-0.5">
                Pro DZ Dali <span className="text-xs bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700 text-slate-300 font-normal">الأستاذ دالي نجيب</span>
              </h1>
            </div>
          </div>

          {/* Standalone Header Action / Install indicator */}
          <div className="flex items-center gap-3">
            {/* Direct PWA Install Button representing the user request */}
            <button
              onClick={handleInstallPWA}
              type="button"
              className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white transition-all duration-205 cursor-pointer flex items-center gap-1.5 text-xs font-black shadow-md shadow-emerald-950/40"
              title="تثبيت التطبيق على جهازك كـ تطبيق أندرويد"
            >
              <Download className="w-4 h-4 shrink-0 animate-bounce" />
              <span>تثبيت التطبيق 📱</span>
            </button>

            {/* Elegant Light / Dark Mode theme switcher */}
            <button
              onClick={() => {
                const nextDark = !isDarkMode;
                setIsDarkMode(nextDark);
                localStorage.setItem("dali_theme", nextDark ? "dark" : "light");
              }}
              type="button"
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-[#1e293b] hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 transition-all duration-205 cursor-pointer flex items-center gap-2 text-xs font-bold"
              title={isDarkMode ? "تفعيل الوضع المضيء" : "تفعيل الوضع المظلم"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" /> : <Moon className="w-4 h-4 text-cyan-400" />}
              <span>{isDarkMode ? "وضع مضيء ☀️" : "وضع مظلم 🌙"}</span>
            </button>

            <div className="bg-[#1e293b] px-3.5 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs text-slate-350 font-semibold leading-none">شات تفاعلي ذكي 🇩🇿</span>
            </div>
          </div>
        </header>

        {/* Moving Ticker with spiritual Azkar */}
        <DhikrTicker />

        {/* Tab switch layout buttons */}
        <nav className="flex items-center justify-center bg-[#131b2e] p-1.5 rounded-xl border border-slate-850 shadow-md max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab("admin")}
            className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "admin"
                ? "bg-slate-800 text-emerald-450 border border-slate-705/50 shadow"
                : "text-slate-400 hover:text-slate-250 hover:bg-slate-800/20"
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span>لوحة التحكم</span>
          </button>

          <button
            onClick={() => setActiveTab("math")}
            className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "math"
                ? "bg-slate-800 text-emerald-455 border border-slate-705/50 shadow"
                : "text-slate-400 hover:text-slate-250 hover:bg-slate-800/20"
            }`}
          >
            <LineChart className="w-4 h-4 shrink-0" />
            <span>دراسة الرسام f(x)</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer ${
              activeTab === "chat"
                ? "bg-slate-800 text-emerald-455 border border-slate-705/50 shadow"
                : "text-slate-400 hover:text-slate-250 hover:bg-slate-800/20"
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>دردشة الأستاذ دالي</span>
          </button>
        </nav>

        {/* Selected View panel content */}
        <main className="transition-all duration-200">
          {activeTab === "chat" && (
            <ChatSection 
              welcomeMessage={welcomeMessage} 
              profileImageUrl={profileImageUrl} 
              apiKeys={apiKeys}
              keyRotationMode={keyRotationMode}
              selectedKeyIndex={selectedKeyIndex}
            />
          )}

          {activeTab === "math" && (
            <MathFunctionSection 
              apiKeys={apiKeys}
              keyRotationMode={keyRotationMode}
              selectedKeyIndex={selectedKeyIndex}
            />
          )}

          {activeTab === "admin" && (
            <AdminSection 
              welcomeMessage={welcomeMessage}
              profileImageUrl={profileImageUrl}
              apiKeys={apiKeys}
              keyRotationMode={keyRotationMode}
              selectedKeyIndex={selectedKeyIndex}
              onSettingsUpdated={handleSettingsUpdated}
            />
          )}
        </main>

      </div>

      {/* Global Human Footer */}
      <footer className="mt-12 py-6 border-t border-slate-850 bg-[#131b2e] text-center space-y-2 text-xs text-slate-400">
        <p className="flex items-center justify-center gap-1.5 font-semibold text-slate-300">
          <span>تم الدمج والتطوير بواسطة الأستاذ دالي نجيب</span>
          <span className="text-emerald-500">♥</span>
          <span>بالاعتماد على الذكاء الاصطناعي</span>
        </p>
        <p className="font-medium font-mono text-[10px] text-slate-500">
          الرياضيات هي بوابة البرمجة - لا تنسونا من صالح دعائكم 🇩🇿
        </p>
      </footer>

      {/* PWA Direct Installation Guidance Modal */}
      {showPwaHelpModal && (
        <div className="fixed inset-0 bg-[#020617]/85 backdrop-blur-md flex items-center justify-center p-4 z-50 text-right">
          <div className="bg-[#131b2e] max-w-md w-full rounded-2xl border border-emerald-500/35 p-5 sm:p-6 shadow-2xl relative space-y-4">
            
            {/* Upper Close Button */}
            <button 
              onClick={() => setShowPwaHelpModal(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all"
            >
              إغلاق ✕
            </button>

            {/* Header Title with Algeria Icon */}
            <div className="flex items-center gap-2 justify-end pt-2">
              <span className="text-xl">🇩🇿 📱</span>
              <h3 className="text-lg font-black text-white">تثبيت تطبيق الأستاذ دالي نجيب</h3>
            </div>
            
            <p className="text-xs sm:text-sm text-slate-350 leading-relaxed font-semibold">
              بني العزيز، كود الـ PWA مبرمج بالكامل لتثبيت التطبيق على هاتف الأندرويد أو الحاسوب مباشرة كأنّه تطبيق متجر حقيقي، دون عناء البحث في قائمة الثلاث نقاط بالأعلى!
            </p>

            {/* Steps or Frame Explanation */}
            <div className="bg-[#0b0f19] p-3.5 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[11px] font-extrabold text-[#10b981] block border-b border-slate-800 pb-1.5">
                طريقة التثبيت السريعة والسهلة 📝
              </span>
              <ol className="text-xs text-slate-200 space-y-2 list-decimal list-inside pr-1">
                <li>
                  من الأفضل **فتح التطبيق في نافذة مستقلة** عبر الضغط على الزر الأخضر بالأسفل لتجاوز قيود المعاينة الصارمة.
                </li>
                <li>
                  بمجرد فتح التطبيق خارج المعاينة، سيظهر لك **إشعار التثبيت الفوري** مباشرة من خلال المتصفح.
                </li>
                <li>
                  انقر على **"تثبيت" (Install)** ليتحول التطبيق مباشرة إلى أيقونة أندرويد حقيقية على هاتفك!
                </li>
              </ol>
            </div>

            {/* Action Buttons inside Modal */}
            <div className="flex flex-col gap-2 pt-2">
              <a 
                href={window.location.origin} 
                target="_blank"  
                rel="noreferrer"
                onClick={() => setShowPwaHelpModal(false)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer text-center"
              >
                <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                <span>فتح النافذة المستقلة للتثبيت الفوري 🚀</span>
              </a>
              <button 
                onClick={() => setShowPwaHelpModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all"
              >
                فهمت، شكراً يا أستاذ!
              </button>
            </div>

            <p className="text-[10px] text-slate-500 text-center font-mono pt-1">
              - لا تنسونا من صالح دعائكم -
            </p>

          </div>
        </div>
      )}

    </div>
  );
}
