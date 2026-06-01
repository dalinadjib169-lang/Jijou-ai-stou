import React, { useState, useEffect } from "react";
import { MessageSquare, LineChart, Shield, Download, Sparkles, Heart } from "lucide-react";
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

  // PWA standalone installation states
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);

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
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`Direct installation choice: ${outcome}`);
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  const handleSettingsUpdated = (newImg: string, newMsg: string, newKeys: string[]) => {
    setProfileImageUrl(newImg);
    setWelcomeMessage(newMsg);
    setApiKeys(newKeys);
    // Instant sync verification
    localStorage.setItem("dali_profileImageUrl", newImg);
    localStorage.setItem("dali_welcomeMessage", newMsg);
    localStorage.setItem("dali_apiKeys", JSON.stringify(newKeys));
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col justify-between font-sans selection:bg-emerald-600/30">
      
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
            />
          )}

          {activeTab === "math" && (
            <MathFunctionSection />
          )}

          {activeTab === "admin" && (
            <AdminSection 
              welcomeMessage={welcomeMessage}
              profileImageUrl={profileImageUrl}
              apiKeys={apiKeys}
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

    </div>
  );
}
