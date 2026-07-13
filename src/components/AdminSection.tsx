import React, { useState, useEffect } from "react";
import { auth, loginWithGoogle } from "../firebase";
import { signOut, User } from "firebase/auth";
import { LogIn, LogOut, Save, Key, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

interface AdminSectionProps {
  isDarkMode?: boolean;
  welcomeMessage: string;
  setWelcomeMessage: (v: string) => void;
  profileImageUrl: string;
  setProfileImageUrl: (v: string) => void;
}

export default function AdminSection({ 
  isDarkMode = true,
  welcomeMessage, 
  setWelcomeMessage,
  profileImageUrl, 
  setProfileImageUrl 
}: AdminSectionProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  
  const [targetMsg, setTargetMsg] = useState(welcomeMessage);
  const [targetImg, setTargetImg] = useState(profileImageUrl);

  const [saveSuccess, setSaveSuccess] = useState(false);
  const [keyStats, setKeyStats] = useState<{keyId: string, requests: number, errors: number, lastUsed: string | null}[]>([]);

  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setIsLoadingAuth(false);
      
      if (u) {
        // Fetch key status when logged in
        fetch("/api/admin/keys-status")
          .then(res => res.json())
          .then(data => setKeyStats(data.keys || []))
          .catch(err => console.error("Failed to load key stats", err));
      }
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const idToken = await user.getIdToken(true);
      const res = await fetch("/api/admin/save-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          idToken,
          welcomeMessage: targetMsg,
          profileImageUrl: targetImg,
          apiKeys: [],
          keyRotationMode: "sequential",
          selectedKeyIndex: -1
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData?.error || "فشل الحفظ");
      }

      setWelcomeMessage(targetMsg);
      setProfileImageUrl(targetImg);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "حدث خطأ أثناء الحفظ.");
    } finally {
      setIsSaving(false);
    }
  };

  
  if (isLoadingAuth) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl text-center">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">منطقة الإدارة المغلقة</h2>
        <p className="text-slate-400 mb-6 text-sm">هذه الصفحة مخصصة للأستاذ دالي فقط. يرجى تسجيل الدخول بحساب المشرف للوصول إلى لوحة التحكم.</p>
        <button 
          onClick={loginWithGoogle}
          className="bg-white hover:bg-slate-100 text-slate-900 px-6 py-3 rounded-xl font-bold transition-colors w-full flex items-center justify-center gap-2"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          تسجيل الدخول باستخدام Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto rounded-3xl bg-gradient-to-b from-slate-900 to-[#0b0f19] border border-slate-800 shadow-2xl overflow-hidden" dir="rtl">
      {/* Header */}
      <div className="bg-slate-900/80 p-5 border-b border-slate-800 flex justify-between items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5 blur-xl"></div>
        <div className="flex items-center gap-3 relative z-10">
          <img src={user.photoURL || "https://img.icons8.com/color/150/user-male-circle.png"} alt="Admin" className="w-10 h-10 rounded-full border border-slate-700" />
          <div>
            <h2 className="text-emerald-400 font-bold text-sm">لوحة تحكم الأستاذ دالي</h2>
            <p className="text-xs text-slate-500 font-mono mt-0.5">{user.email}</p>
          </div>
        </div>
        <button 
          onClick={() => signOut(auth)}
          className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 p-2.5 rounded-xl transition-colors relative z-10"
          title="تسجيل الخروج"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-8">
        
        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Save className="w-5 h-5 text-emerald-500" />
            إعدادات الواجهة الأساسية
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">الرسالة الترحيبية للروبوت</label>
              <textarea 
                value={targetMsg}
                onChange={(e) => setTargetMsg(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:border-emerald-500 outline-none h-24 resize-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                رابط صورة الأستاذ (Avatar URL)
              </label>
              <input 
                type="text" 
                value={targetImg}
                onChange={(e) => setTargetImg(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-200 focus:border-emerald-500 outline-none text-left"
                dir="ltr"
              />
            </div>
          </div>
        </div>

        {/* API key stats */}
        <div className="space-y-3 pt-6 border-t border-slate-800/80">
          <h5 className="text-white font-black text-sm flex items-center justify-end gap-1.5">
            مفاتيح Vercel المفعّلة (Key Status)
            <Key className="w-4 h-4 text-emerald-400" />
          </h5>
          
          <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4 text-right">
            <p className="text-xs text-slate-400">
              تتم قراءة مفاتيح API وعملية التدوير تلقائياً من بيئة Vercel. 
              لا يمكن إضافة أو حذف المفاتيح من هنا.
            </p>

            {keyStats.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
                <p className="text-slate-500 font-bold text-xs">جاري جلب المفاتيح أو لا يوجد مفاتيح مفعّلة...</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 max-h-48 overflow-y-auto space-y-1">
                {keyStats.map((stat, index) => (
                  <div key={index} className="flex flex-col p-3 rounded-xl text-xs font-mono font-bold transition-all border border-slate-800/60 bg-slate-900/40">
                    <div className="flex justify-between w-full text-slate-300">
                       <span className="text-emerald-400">مفتاح #{index + 1}</span>
                       <span dir="ltr">{stat.keyId}</span>
                    </div>
                    <div className="flex justify-between w-full mt-2 text-[10px] text-slate-500">
                       <span>آخر استخدام: {stat.lastUsed ? new Date(stat.lastUsed).toLocaleTimeString('ar-DZ') : 'لم يستخدم بعد'}</span>
                       <span>طلبات: {stat.requests} | أخطاء: {stat.errors}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 flex items-center justify-between">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-emerald-500/20"
          >
            {isSaving ? "جاري الحفظ..." : "حفظ الإعدادات والتأمين"}
          </button>
          
          {saveSuccess && (
            <span className="text-emerald-400 text-xs font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg animate-pulse">
              ✅ تم الحفظ بنجاح
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
