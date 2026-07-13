const fs = require('fs');

const content = `import React, { useState, useEffect } from "react";
import { MessageSquare, LineChart, Shield, Sparkles, Heart, Sun, Moon, Check, Key } from "lucide-react";
import ChatSection from "./components/ChatSection";
import MathFunctionSection from "./components/MathFunctionSection";
import AdminSection from "./components/AdminSection";
import DhikrTicker from "./components/DhikrTicker";
import { db } from "./firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";

export default function App() {
  const [activeTab, setActiveTab] = useState<"chat" | "math" | "admin">("chat");

  const [freeQuestionsUsed, setFreeQuestionsUsed] = useState<number>(() => {
    return Number(localStorage.getItem("dali_freeQuestionsUsed")) || 0;
  });
  const [premiumPoints, setPremiumPoints] = useState<number>(() => {
    return Number(localStorage.getItem("dali_premiumPoints")) || 0;
  });
  
  const [showPointsModal, setShowPointsModal] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState("");

  const handleDeductPoint = (): boolean => {
    if (premiumPoints > 0) {
      const newPoints = premiumPoints - 1;
      setPremiumPoints(newPoints);
      localStorage.setItem("dali_premiumPoints", String(newPoints));
      return true;
    }
    if (freeQuestionsUsed < 10) {
      const newUsed = freeQuestionsUsed + 1;
      setFreeQuestionsUsed(newUsed);
      localStorage.setItem("dali_freeQuestionsUsed", String(newUsed));
      return true;
    }
    setShowPointsModal(true);
    return false;
  };

  const handleActivateCode = async () => {
    if (!activationCode.trim()) return;
    setIsActivating(true);
    setActivationError("");
    try {
      const codeDoc = doc(db, "activation_codes", activationCode.trim());
      const docSnap = await getDoc(codeDoc);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.used) {
          setActivationError("عذراً، هذا الكود تم استخدامه مسبقاً.");
        } else {
          const addedPoints = data.points || 50;
          await updateDoc(codeDoc, { used: true, usedAt: new Date() });
          const newPoints = premiumPoints + addedPoints;
          setPremiumPoints(newPoints);
          localStorage.setItem("dali_premiumPoints", String(newPoints));
          setShowPointsModal(false);
          setActivationCode("");
          alert(\`🎉 تم تفعيل الكود بنجاح! تمت إضافة \${addedPoints} نقطة لرصيدك.\`);
        }
      } else {
        setActivationError("الكود غير صحيح أو غير موجود.");
      }
    } catch (err: any) {
      console.error(err);
      setActivationError("حدث خطأ أثناء الاتصال بالخادم.");
    } finally {
      setIsActivating(false);
    }
  };

  const [welcomeMessage, setWelcomeMessage] = useState(() => {
    return localStorage.getItem("dali_welcomeMessage") || "مرحبا بيك خويا اختي انا الاستاذ دالي استاذ مادة رياضيات و مبرمج بذكاء اصطناعي كيفاش نقدر نساعدك؟";
  });
  
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

  const [keyRotationMode, setKeyRotationMode] = useState<"sequential" | "manual">(() => {
    return (localStorage.getItem("dali_keyRotationMode") as "sequential" | "manual") || "sequential";
  });

  const [selectedKeyIndex, setSelectedKeyIndex] = useState<number>(() => {
    const val = localStorage.getItem("dali_selectedKeyIndex");
    return val ? Number(val) : -1;
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("dali_theme");
    return saved !== "light";
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem("dali_theme", newMode ? "dark" : "light");
      return newMode;
    });
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('bg-[#0b0f19]');
      document.body.classList.remove('bg-slate-50');
      document.documentElement.classList.remove('light-theme-wrapper');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('bg-[#0b0f19]');
      document.body.classList.add('bg-slate-50');
      document.documentElement.classList.add('light-theme-wrapper');
    }
  }, [isDarkMode]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/public/config");
        if (response.ok) {
          const data = await response.json();
          if (data.welcomeMessage) {
            setWelcomeMessage(data.welcomeMessage);
            localStorage.setItem("dali_welcomeMessage", data.welcomeMessage);
          }
          if (data.profileImageUrl) {
            setProfileImageUrl(data.profileImageUrl);
            localStorage.setItem("dali_profileImageUrl", data.profileImageUrl);
          }
        }
      } catch (err) {
        console.warn("Could not fetch global settings from server, using local fallback");
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className={\`min-h-screen text-slate-100 font-sans relative overflow-hidden transition-colors duration-300 \${isDarkMode ? 'bg-[#0b0f19]' : 'bg-slate-50'}\`} dir="rtl">
      {/* Background Decorative Gradients */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-teal-600/5 rounded-full blur-[150px] -z-10 pointer-events-none"></div>
      
      <DhikrTicker isDarkMode={isDarkMode} />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-4">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => setActiveTab("admin")}>
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full blur opacity-25 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
              <img 
                src={profileImageUrl || "https://img.icons8.com/color/150/user-male-circle.png"}
                alt="الأستاذ دالي" 
                className="relative w-16 h-16 rounded-full object-cover border-2 border-slate-700/50 shadow-2xl"
              />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0f172a] flex items-center justify-center">
                <Check className="w-3 h-3 text-[#0f172a]" />
              </div>
            </div>
            
            <div className="text-right">
              <h1 className={\`text-2xl font-black tracking-tight flex items-center gap-2 \${isDarkMode ? 'text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200' : 'text-emerald-700'}\`}>
                الأستاذ دالي
                <Sparkles className="w-5 h-5 text-amber-400" />
              </h1>
              <p className={\`text-sm font-medium mt-1 \${isDarkMode ? 'text-slate-400' : 'text-slate-600'}\`}>
                مساعدك الذكي في الرياضيات والمنهاج 🇩🇿
              </p>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={\`p-2.5 rounded-full transition-all \${isDarkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-700' : 'bg-white text-slate-700 shadow-md border border-slate-200 hover:bg-slate-50'}\`}
                title={isDarkMode ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              
              <div className={\`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm \${isDarkMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}\`}>
                <Heart className={\`w-4 h-4 \${premiumPoints > 0 ? 'text-rose-500 fill-rose-500/20' : isDarkMode ? 'text-slate-500' : 'text-slate-400'}\`} />
                <span className={\`text-sm font-bold \${isDarkMode ? 'text-slate-200' : 'text-slate-700'}\`}>
                  {premiumPoints > 0 ? \`\${premiumPoints} نقطة مميزة\` : \`\${10 - freeQuestionsUsed} مجاني\`}
                </span>
                {premiumPoints === 0 && freeQuestionsUsed >= 10 && (
                  <span className="text-xs text-rose-500 font-bold ml-2">انتهى الرصيد</span>
                )}
                <button 
                  onClick={() => setShowPointsModal(true)}
                  className="mr-2 text-xs bg-emerald-500 hover:bg-emerald-600 text-white px-2 py-1 rounded transition-colors"
                >
                  شحن
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Navigation */}
        <nav className={\`flex p-1.5 mb-6 rounded-xl border shadow-lg \${isDarkMode ? 'bg-[#131b2e] border-slate-800/50' : 'bg-white border-slate-200'}\`}>
          <button
            onClick={() => setActiveTab("chat")}
            className={\`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer \${
              activeTab === "chat"
                ? (isDarkMode ? "bg-slate-800 text-emerald-400 border border-slate-700/50 shadow" : "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm")
                : (isDarkMode ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100")
            }\`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">دردشة الأستاذ</span>
            <span className="sm:hidden">دردشة</span>
          </button>

          <button
            onClick={() => setActiveTab("math")}
            className={\`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer \${
              activeTab === "math"
                ? (isDarkMode ? "bg-slate-800 text-emerald-400 border border-slate-700/50 shadow" : "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm")
                : (isDarkMode ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100")
            }\`}
          >
            <LineChart className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">الدراسة الذكية</span>
            <span className="sm:hidden">دراسة</span>
          </button>

          <button
            onClick={() => setActiveTab("admin")}
            className={\`flex items-center justify-center gap-2 flex-1 py-2 rounded-lg text-xs md:text-sm font-bold transition-all duration-200 cursor-pointer \${
              activeTab === "admin"
                ? (isDarkMode ? "bg-slate-800 text-emerald-400 border border-slate-700/50 shadow" : "bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm")
                : (isDarkMode ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/20" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100")
            }\`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">لوحة التحكم</span>
            <span className="sm:hidden">تحكم</span>
          </button>
        </nav>

        {/* Selected View panel content */}
        <main className="transition-all duration-200">
          {activeTab === "chat" && (
            <ChatSection 
              isDarkMode={isDarkMode} 
              welcomeMessage={welcomeMessage} 
              profileImageUrl={profileImageUrl} 
              apiKeys={apiKeys}
              keyRotationMode={keyRotationMode}
              selectedKeyIndex={selectedKeyIndex}
              onDeductPoint={handleDeductPoint}
            />
          )}
          {activeTab === "math" && (
            <MathFunctionSection 
              isDarkMode={isDarkMode} 
              profileImageUrl={profileImageUrl}
              apiKeys={apiKeys}
              keyRotationMode={keyRotationMode}
              selectedKeyIndex={selectedKeyIndex}
              onDeductPoint={handleDeductPoint}
            />
          )}
          {activeTab === "admin" && (
            <AdminSection 
              isDarkMode={isDarkMode} 
              welcomeMessage={welcomeMessage}
              setWelcomeMessage={setWelcomeMessage}
              profileImageUrl={profileImageUrl}
              setProfileImageUrl={setProfileImageUrl}
              apiKeys={apiKeys}
              setApiKeys={setApiKeys}
              keyRotationMode={keyRotationMode}
              setKeyRotationMode={setKeyRotationMode}
              selectedKeyIndex={selectedKeyIndex}
              setSelectedKeyIndex={setSelectedKeyIndex}
            />
          )}
        </main>
      </div>

      {/* Premium Points / Activation Modal */}
      {showPointsModal && (
        <div className="fixed inset-0 bg-[#0b0f19]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={\`\${isDarkMode ? 'bg-[#131b2e] border-slate-700' : 'bg-white border-slate-200'} border p-6 rounded-2xl max-w-sm w-full shadow-2xl relative overflow-hidden\`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
            
            <h3 className={\`text-xl font-bold mb-2 flex items-center gap-2 \${isDarkMode ? 'text-white' : 'text-slate-800'}\`}>
              <Key className="w-5 h-5 text-emerald-500" />
              شحن الرصيد المميز
            </h3>
            
            <p className={\`text-sm mb-6 leading-relaxed \${isDarkMode ? 'text-slate-300' : 'text-slate-600'}\`}>
              لقد استهلكت جميع أسئلتك المجانية. لتتمكن من مواصلة استخدام الأستاذ دالي، يرجى إدخال كود التفعيل الخاص بك.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className={\`block text-xs font-bold mb-2 \${isDarkMode ? 'text-slate-400' : 'text-slate-600'}\`}>
                  كود التفعيل (Activation Code)
                </label>
                <input 
                  type="text" 
                  value={activationCode}
                  onChange={(e) => setActivationCode(e.target.value)}
                  placeholder="أدخل كود التفعيل هنا..."
                  className={\`w-full p-3 rounded-xl border text-sm font-mono text-center tracking-widest outline-none transition-all \${isDarkMode ? 'bg-slate-900/50 border-slate-700 focus:border-emerald-500 text-white' : 'bg-slate-50 border-slate-300 focus:border-emerald-500 text-slate-800'}\`}
                  dir="ltr"
                />
              </div>
              
              {activationError && (
                <div className="text-xs text-rose-500 font-bold bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                  {activationError}
                </div>
              )}
              
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowPointsModal(false)}
                  className={\`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all \${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleActivateCode}
                  disabled={isActivating || !activationCode.trim()}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isActivating ? 'جاري التحقق...' : 'تفعيل الكود'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("App.tsx fixed");
