import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, loginWithGoogle, OperationType, handleFirestoreError } from "../firebase";
import { signOut, User } from "firebase/auth";
import { LogIn, LogOut, Save, Key, Plus, Trash2, Image as ImageIcon, CheckCircle, AlertTriangle, HelpCircle, Loader2 } from "lucide-react";

interface AdminSectionProps {
  onSettingsUpdated: () => void;
  welcomeMessage: string;
  profileImageUrl: string;
  apiKeys: string[];
}

export default function AdminSection({ onSettingsUpdated, welcomeMessage, profileImageUrl, apiKeys }: AdminSectionProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Settings Form state
  const [profileImage, setProfileImage] = useState("");
  const [welcomeMsg, setWelcomeMsg] = useState("");
  const [keysList, setKeysList] = useState<string[]>([]);
  const [newKey, setNewKey] = useState("");
  
  const [uploadLoading, setUploadLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // Sync local state when props change
    setProfileImage(profileImageUrl);
    setWelcomeMsg(welcomeMessage);
    setKeysList(apiKeys || []);
  }, [profileImageUrl, welcomeMessage, apiKeys]);

  useEffect(() => {
    // Listen for authentication changes
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    setAuthError(null);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError(err.message || "فشلت عملية تسجيل الدخول.");
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error(err);
    }
  };

  // Cloudinary profile image direct upload
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      // We will try standard unsigned presets. Usually Cloudinary requires a preset names e.g., 'ml_default'. 
      // We can also allow them to append and upload
      formData.append("upload_preset", "ml_default");

      const res = await fetch("https://api.cloudinary.com/v1_1/doaxziqm7/image/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfileImage(data.secure_url);
        alert("✓ تم رفع وتحديث الصورة بنجاح على كلاوديناري!");
      } else {
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || "فشل الرفع المباشر.");
      }
    } catch (err: any) {
      console.warn("Cloudinary direct upload failed, falling back to manual paste or default:", err);
      alert(`ملاحظة: لرفع الصورة بنجاح، تأكد من تفعيل "Unsigned Uploads" في إعدادات كلاوديناري الخاصة بك، أو قم بلصق رابط صورتك مباشرة في الحقل المخصص أدناه كخيار بديل وسريع!`);
    } finally {
      setUploadLoading(false);
    }
  };

  // Add key to rotation list
  const addApiKey = () => {
    const keyTrimmed = newKey.trim();
    if (!keyTrimmed) return;
    if (keysList.includes(keyTrimmed)) {
      alert("هذا المفتاح مضاف بالفعل.");
      return;
    }
    setKeysList([...keysList, keyTrimmed]);
    setNewKey("");
  };

  // Remove key from rotation list
  const removeApiKey = (idxToRemove: number) => {
    setKeysList(keysList.filter((_, idx) => idx !== idxToRemove));
  };

  // Persist configurations inside firestore settings/dali document
  const handleSaveSettings = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const docRef = doc(db, "settings", "dali");
      const uploadPayload = {
        profileImageUrl: profileImage.trim() || "https://img.icons8.com/color/150/user-male-circle.png",
        welcomeMessage: welcomeMsg.trim(),
        apiKeys: keysList
      };

      await setDoc(docRef, uploadPayload);
      setSaveSuccess(true);
      onSettingsUpdated();
      
      setTimeout(() => {
        setSaveSuccess(false);
      }, 4000);

    } catch (err: any) {
      console.error(err);
      handleFirestoreError(err, OperationType.WRITE, "settings/dali");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingAuth) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-gray-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm">جاري التوثيق وتأمين النظام...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-right">
      
      {!user ? (
        /* Sign-In lock wall card */
        <div className="bg-[#111c30] p-8 rounded-2xl border border-white/5 shadow-2xl space-y-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-2xl font-bold animate-pulse">
            🔒
          </div>
          
          <div className="space-y-2">
            <h3 className="text-white font-black text-xl">لوحة تحكم الأستاذ دالي</h3>
            <p className="text-xs text-gray-400 px-4 leading-relaxed">
              هذه الواجهة محمية وخاصة بالأستاذ دالي نجيب فقط لتحديث صورة بروفيله، تدوير مفاتيح Gemini API، وتعديل الرسالة الترحيبية للدروس.
            </p>
          </div>

          {authError && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-xl border border-red-500/20 text-xs text-right flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <p className="leading-relaxed">{authError}</p>
            </div>
          )}

          <button
            onClick={handleSignIn}
            className="w-full bg-[#0c1322] hover:bg-black/40 text-white hover:text-emerald-400 font-bold py-3 px-4 rounded-xl border border-white/5 hover:border-emerald-500/25 transition-all duration-200 flex items-center justify-center gap-2.5"
          >
            <LogIn className="w-5 h-5 text-emerald-400" />
            <span>تسجيل الدخول الآمن بحساب Google</span>
          </button>
          
          <div className="border-t border-white/5 pt-4 text-[11px] text-gray-500 leading-relaxed text-right">
            🛡️ الحسابات المصرحة فقط للوصول السحابي المباشر:
            <ul className="list-disc list-inside mt-1 space-y-0.5 max-w-xs mx-auto text-left font-mono text-gray-400">
              <li>dalind1990@gmail.com</li>
              <li>dalinadjib169@gmail.com</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Authenticated Control settings dashboard */
        <div className="bg-[#111c30] p-6 md:p-8 rounded-2xl border border-white/5 shadow-2xl space-y-6">
          
          {/* Header Profile Info bar button */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-white/5 pb-4 gap-4">
            <button
              onClick={handleSignOut}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-red-500/20 transition-all font-semibold active:scale-98 order-2 sm:order-1"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
            
            <div className="flex items-center gap-3 order-1 sm:order-2">
              <div className="text-right">
                <h4 className="text-white font-bold text-base md:text-lg">مرحباً الأستاذ دالي 🇩🇿</h4>
                <p className="text-xs text-emerald-400 font-mono mt-0.5">{user.email}</p>
              </div>
              <img 
                referrerPolicy="no-referrer"
                src={profileImage || "https://img.icons8.com/color/150/user-male-circle.png"} 
                alt="بروفايلك" 
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md"
              />
            </div>
          </div>

          {/* Configuration Form inputs */}
          <div className="space-y-6">
            
            {/* 1. Profile image settings and Cloudinary integration instructions */}
            <div className="space-y-3">
              <h5 className="text-white font-bold text-sm flex items-center justify-end gap-1.5">
                تحديث صورة الملف الشخصي (Profile Photo)
                <ImageIcon className="w-4 h-4 text-emerald-400" />
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-1 flex flex-col items-center justify-center p-3 bg-[#0c1322] rounded-xl border border-white/5">
                  <img 
                    referrerPolicy="no-referrer"
                    src={profileImage || "https://img.icons8.com/color/150/user-male-circle.png"} 
                    alt="معاينة" 
                    className="w-20 h-20 rounded-full object-cover border border-emerald-500 shadow mb-2"
                  />
                  <span className="text-[10px] text-gray-500 font-semibold">الصورة الحالية</span>
                </div>

                <div className="md:col-span-3 space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">الرفع المباشر الذاتي لكلاوديناري (Cloudinary Upload):</label>
                    <input 
                      type="file"
                      id="profile-upload"
                      accept="image/*"
                      onChange={handleProfilePhotoUpload}
                      disabled={uploadLoading}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => document.getElementById("profile-upload")?.click()}
                      disabled={uploadLoading}
                      className="w-full bg-[#0c1322] hover:bg-[#15243d] border border-white/5 hover:border-emerald-500/25 text-gray-300 py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all"
                    >
                      {uploadLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                          <span>جاري رفع وتحديث صورتك...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-emerald-400" />
                          <span>اختر صورة كأيقونة من جهازك للرفع التلقائي 🇩🇿</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-gray-500 block mt-1">الرفع على namespace الخاص بك: doaxziqm7</span>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-1">...أو ببساطة الصق رابط الصورة مباشرةً لتوفير الوقت:</label>
                    <input 
                      type="text"
                      value={profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      placeholder="لصق رابط الصورة مباشرة هنا (مثال: https://...)"
                      className="w-full bg-[#0c1322] border border-white/5 rounded-xl px-4 py-2.5 text-left font-mono text-white text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Custom dynamic greeting welcome card */}
            <div className="space-y-3">
              <h5 className="text-white font-bold text-sm flex items-center justify-end gap-1.5">
                الرسالة الترحيبية للدروس (Welcome Message)
                <HelpCircle className="w-4 h-4 text-emerald-400" />
              </h5>
              <textarea
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                rows={3}
                placeholder="مرحباً، أنا الأستاذ دالي..."
                className="w-full bg-[#0c1322] border border-white/5 rounded-xl p-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-right leading-relaxed"
              />
              <p className="text-[10px] text-gray-500 leading-relaxed">
                تظهر هذه الرسالة للطالب بداخل البطاقة الترحيبية بمجرد تشغيل التطبيق في جهازه.
              </p>
            </div>

            {/* 3. API key rotation manager dashboard module */}
            <div className="space-y-3">
              <h5 className="text-white font-bold text-sm flex items-center justify-end gap-1.5">
                تدوير مفاتيح Gemini API لضمان التغطية المستمرة (Key Rotation)
                <Key className="w-4 h-4 text-emerald-400" />
              </h5>

              <div className="bg-[#0c1322] p-4 rounded-xl border border-white/5 space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="أدخل مفتاح Gemini API جديد للحشو والتأمين"
                    className="flex-1 bg-[#090d16] border border-white/5 rounded-lg px-3 py-2 text-left font-mono text-white text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={addApiKey}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs text-gray-400 font-semibold">المفاتيح المدورة حالياً : ({keysList.length})</span>
                  {keysList.length === 0 ? (
                    <div className="bg-amber-500/5 text-amber-500/80 border border-amber-500/10 p-3 rounded-lg text-xs leading-relaxed text-right flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>لا توجد مفاتيح إضافية مضافة حالياً. سيقوم النظام أوتوماتيكياً بالاعتماد على ذكاء الـ fallback الافتراضي.</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-white/5 max-h-36 overflow-y-auto">
                      {keysList.map((k, index) => (
                        <div key={index} className="flex items-center justify-between py-2 text-xs font-mono">
                          <button
                            onClick={() => removeApiKey(index)}
                            className="text-red-400 hover:text-red-500 hover:bg-red-500/10 p-1.5 rounded transition-colors"
                            title="إزالة هذا المفتاح"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-gray-400 truncate max-w-sm">
                            {k.substring(0, 10)}...{k.substring(k.length - 8)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className="text-[10px] text-gray-500 leading-relaxed font-normal">
                  💡 تدوير ذكي: عند قيام الطالب بتقديم سؤال، يقوم الخادم بالانتقال والتناوب الذكي بين هذه المفاتيح لتجنب نفاذ حصص الاستخدام المتاحة.
                </p>
              </div>
            </div>

            {/* Error and success panels, submit buttons */}
            {saveSuccess && (
              <div className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 p-4 rounded-xl text-xs flex items-center gap-2 animate-fade-in">
                <CheckCircle className="w-5 h-5 shrink-0" />
                <span>✓ تم حفظ الإعدادات بنجاح في قاعدة البيانات السحابية! تم تحديث الشات أوتوماتيكياً.</span>
              </div>
            )}

            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري حفظ البيانات السحابية...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>حفظ وتطبيق الإعدادات المحدثة</span>
                </>
              )}
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
