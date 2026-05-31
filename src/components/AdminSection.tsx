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

  // Cloudinary profile image direct upload with custom requested endpoint URL
  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default"); // standard Cloudinary unsigned preset

      const res = await fetch("https://api.cloudinary.com/v1_1/doaxziqm7/image/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setProfileImage(data.secure_url);
        alert("✓ تم رفع وتحديث صورتك الشخصية بنجاح على كلاوديناري الخاص بالأستاذ دالي!");
      } else {
        const errorData = await res.json();
        throw new Error(errorData?.error?.message || "فشل الرفع المباشر.");
      }
    } catch (err: any) {
      console.warn("Cloudinary direct upload failed, falling back to manual paste or default:", err);
      alert(`ملاحظة مهمة: لرفع الصورة بنجاح وتخزينها، تأكد من تفعيل "Unsigned Uploads" وتعيين ml_default كاسم للـ preset في حساب Cloudinary (doaxziqm7) الخاص بك. كخيار أسرع، يمكنك ببساطة لصق رابط أي صورة مباشرة في الحقل المخصص بالأسفل لتظهر كأيقونة في الشات فوراً!`);
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
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-sm font-bold">جاري التوثيق وتأمين النظام...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 text-right">
      
      {!user ? (
        /* Sign-In lock wall card styled with gorgeous light slate container */
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold border border-red-150 animate-pulse">
            🔒
          </div>
          
          <div className="space-y-2">
            <h3 className="text-slate-800 font-black text-xl">لوحة تحكم الأستاذ دالي</h3>
            <p className="text-xs text-slate-500 px-4 leading-relaxed font-bold">
              هذه الواجهة محمية وخاصة بالأستاذ دالي نجيب لتحديث صورة بروفيله السحابية وتعديل رسالة الترحيب للطلبة وتدوير المفاتيح.
            </p>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-xl border border-red-100 text-xs text-right flex items-start gap-2">
              <span className="shrink-0">⚠️</span>
              <p className="leading-relaxed font-semibold">{authError}</p>
            </div>
          )}

          <button
            onClick={handleSignIn}
            className="w-full bg-slate-900 hover:bg-black text-white hover:text-emerald-400 font-bold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2.5 shadow cursor-pointer"
          >
            <LogIn className="w-5 h-5 text-emerald-400" />
            <span>تسجيل الدخول الآمن بحساب Google</span>
          </button>
          
          <div className="border-t border-slate-100 pt-4 text-[11px] text-slate-400 leading-relaxed text-right font-medium">
            🛡️ الحسابات المصرحة فقط للوصول السحابي المباشر:
            <ul className="list-disc list-inside mt-1 space-y-0.5 max-w-xs mx-auto text-left font-mono text-slate-500">
              <li>dalind1990@gmail.com</li>
              <li>dalinadjib169@gmail.com</li>
            </ul>
          </div>
        </div>
      ) : (
        /* Authenticated Control settings dashboard matching pristine light layout */
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          
          {/* Header Profile Info bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-100 pb-4 gap-4">
            <button
              onClick={handleSignOut}
              className="bg-red-50 hover:bg-red-100 text-red-650 px-4 py-2 rounded-xl text-xs flex items-center gap-2 border border-red-150 transition-all font-bold cursor-pointer active:scale-98 order-2 sm:order-1"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
            
            <div className="flex items-center gap-3 order-1 sm:order-2">
              <div className="text-right">
                <h4 className="text-slate-800 font-black text-base md:text-lg">مرحباً الأستاذ دالي 🇩🇿</h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{user.email}</p>
              </div>
              <img 
                referrerPolicy="no-referrer"
                src={profileImage || "https://img.icons8.com/color/150/user-male-circle.png"} 
                alt="بروفايلك" 
                className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
              />
            </div>
          </div>

          {/* Configuration Form inputs */}
          <div className="space-y-6">
            
            {/* 1. Profile image settings */}
            <div className="space-y-3">
              <h5 className="text-slate-800 font-black text-sm flex items-center justify-end gap-1.5">
                تحديث صورة الملف الشخصي (Profile Photo)
                <ImageIcon className="w-4 h-4 text-emerald-600" />
              </h5>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-1 flex flex-col items-center justify-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <img 
                    referrerPolicy="no-referrer"
                    src={profileImage || "https://img.icons8.com/color/150/user-male-circle.png"} 
                    alt="معاينة" 
                    className="w-20 h-20 rounded-full object-cover border border-emerald-500 shadow mb-2"
                  />
                  <span className="text-[10px] text-slate-400 font-bold">الصورة الحالية</span>
                </div>

                <div className="md:col-span-3 space-y-3">
                  <div>
                    <label className="block text-xs text-slate-500 font-bold mb-1">الرفع المباشر لكلاوديناري (Cloudinary Upload):</label>
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
                      className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer font-bold"
                    >
                      {uploadLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                          <span>جاري رفع وتحديث صورتك...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-emerald-600" />
                          <span>اختر صورة كأيقونة من جهازك للرفع المستمر 🇩🇿</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-slate-400 font-bold block mt-1">مسار doaxziqm7 السحابي الخاص بك</span>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-500 font-bold mb-1">أو ببساطة الصق رابط الصورة مباشرةً هنا:</label>
                    <input 
                      type="text"
                      value={profileImage}
                      onChange={(e) => setProfileImage(e.target.value)}
                      placeholder="رابط الصورة (مثال: https://...)"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-left font-mono text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Custom dynamic greeting welcome card */}
            <div className="space-y-3">
              <h5 className="text-slate-800 font-black text-sm flex items-center justify-end gap-1.5">
                الرسالة الترحيبية للدروس (Welcome Message)
                <HelpCircle className="w-4 h-4 text-emerald-600" />
              </h5>
              <textarea
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                rows={3}
                placeholder="مرحباً، أنا الأستاذ دالي..."
                className="w-full bg-slate-50 border border-slate-200 text-slate-805 rounded-xl p-4 text-sm focus:outline-none focus:border-emerald-500 text-right font-semibold leading-relaxed"
              />
              <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                تظهر هذه الرسالة بمجرد أن يقوم الطالب بفتح تطبيق الأستاذ دالي والدردشة.
              </p>
            </div>

            {/* 3. API key rotation manager */}
            <div className="space-y-3">
              <h5 className="text-slate-800 font-black text-sm flex items-center justify-end gap-1.5">
                تدوير مفاتيح استخدام Gemini API (Key Rotation)
                <Key className="w-4 h-4 text-emerald-600" />
              </h5>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                <div className="flex gap-2">
                  <input 
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    placeholder="أدخل مفتاح Gemini API جديد للتأمين"
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-left font-mono text-slate-800 text-xs focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={addApiKey}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إضافة</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs text-slate-500 font-extrabold">المفاتيح المضافة حالياً للتدوين الآلي: ({keysList.length})</span>
                  {keysList.length === 0 ? (
                    <div className="bg-amber-50 text-amber-800 border border-amber-100 p-3 rounded-lg text-xs leading-relaxed text-right flex items-center gap-2 font-bold">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                      <span>لا توجد مفاتيح إضافية مدونة. يعتمد النظام على الإسناد الافتراضي حالياً.</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100 max-h-36 overflow-y-auto">
                      {keysList.map((k, index) => (
                        <div key={index} className="flex items-center justify-between py-2 text-xs font-mono font-bold">
                          <button
                            onClick={() => removeApiKey(index)}
                            className="text-red-500 hover:text-red-650 hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer"
                            title="إزالة هذا المفتاح"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-slate-500 truncate max-w-sm">
                            {k.substring(0, 10)}...{k.substring(k.length - 8)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <p className="text-[10px] text-slate-400 leading-relaxed font-bold">
                  💡 تدوير ذكي: قمنا بتفعيل التبديل التلقائي لكي يتناوب الطلاب على استخدام المفاتيح المدورة وتفادي انتهاء الحصص.
                </p>
              </div>
            </div>

            {/* Error and success panels, submit buttons */}
            {saveSuccess && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-150 p-4 rounded-xl text-xs flex items-center gap-2 animate-fade-in font-bold shadow-sm">
                <CheckCircle className="w-5 h-5 shrink-0 text-emerald-600" />
                <span>✓ تم حفظ الإعدادات بنجاح في قاعدة البيانات السحابية! تم التحديث فوراً.</span>
              </div>
            )}

            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="w-full bg-emerald-600 hover:bg-[#059669] text-white font-extrabold py-3 rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
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
