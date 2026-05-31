import React, { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, Sparkles, Loader2, RefreshCw, Smartphone, Check, HelpCircle, ArrowDown } from "lucide-react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Message } from "../types";

interface ChatSectionProps {
  welcomeMessage: string;
  profileImageUrl: string;
}

export default function ChatSection({ welcomeMessage, profileImageUrl }: ChatSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageMime, setSelectedImageMime] = useState<string | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  
  // Checking question state
  const [activeQuestion, setActiveQuestion] = useState<{ text: string; options: string[] } | null>(null);
  const [answeredQuestion, setAnsweredQuestion] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quick Math interactive prompts
  const suggestedPrompts = [
    "ممكن تشرح لي مبرهنة القيم المتوسطة ببساطة؟",
    "كيفاش نلقى المستقيم المقارب المائل لدالة ناطقة؟",
    "عندي دالة أسية، عاوني ندرس نهاياتها عند المالانهاية.",
    "اشرح لي إشارة المشتقة وعلاقتها بجدول التغيرات."
  ];

  // Scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  // Image Upload handler (Base64 conversion for Gemini API input)
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setSelectedImageBase64(base64String);
        setSelectedImageMime(file.type);
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Cloudinary image upload (if user wants backup storage)
  const uploadToCloudinary = async (file: File): Promise<string | null> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default"); // typical Cloudinary unsigned preset
      const res = await fetch("https://api.cloudinary.com/v1_1/doaxziqm7/image/upload", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        return data.secure_url;
      }
    } catch (e) {
      console.warn("Cloudinary direct upload failed, relying on secure Base64 transmission:", e);
    }
    return null;
  };

  // Trigger file attachment click
  const triggerImageSelect = () => {
    fileInputRef.current?.click();
  };

  // Function to analyze if Dali returns an evaluation question
  const detectCheckQuestion = (text: string) => {
    // Basic heuristics to see if Dali has asked a question we can parse
    // Since Dali adds questions at the end, we can parse simple math questions
    if (text.includes("؟") || text.includes("سؤال")) {
      // Create a simulated interactive question card for better gamification!
      // This increases the student engagement requested
      const qaMatch = text.match(/\n-\s*(.*)\n/);
      return null; // Let standard AI handle the text flow, and keep it clean
    }
    return null;
  };

  // Send Message implementation
  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMsg;
    if (!textToSend.trim() && !selectedImageBase64) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: Message = {
      id: userMsgId,
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
      imageUrl: imagePreviewUrl || undefined
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputMsg("");
    setIsSending(true);

    // Copying image states and cleaning previews to keep viewport clean
    const currentBase64 = selectedImageBase64;
    const currentMime = selectedImageMime;
    setSelectedImageBase64(null);
    setSelectedImageMime(null);
    setImagePreviewUrl(null);

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({
            role: m.sender,
            text: m.text
          })),
          base64Image: currentBase64,
          mimeType: currentMime
        })
      });

      const resData = await response.json();
      if (response.ok) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          sender: "assistant",
          text: resData.reply,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(resData.error || "عذراً، فشل في جلب الإجابة.");
      }
    } catch (err: any) {
      console.error(err);
      // Let's add a clear user-facing error message from Professor Dali
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "assistant",
        text: `يا بني، حدثت مشكلة تقنية صغيرة معي: "${err.message}". أعد المحاولة وسأوضح لك كل شيء. صلي عل�  return (
    <div className="flex flex-col h-[650px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      
      {/* Top Profile Header */}
      <div className="bg-slate-50 px-5 py-3.5 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              referrerPolicy="no-referrer"
              src={profileImageUrl || "https://img.icons8.com/color/150/user-male-circle.png"} 
              alt="الأستاذ دالي" 
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-md shadow-emerald-500/15"
              onError={(e) => {
                // Fallback avatar
                e.currentTarget.src = "https://img.icons8.com/color/150/user-male-circle.png";
              }}
            />
            <span className="absolute bottom-0 right-0 text-lg leading-none" title="الجزائر 🇩🇿">🇩🇿</span>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base md:text-lg flex items-center gap-2">
              الأستاذ دالي نجيب 
              <span className="bg-emerald-50 text-emerald-700 text-xs px-2.5 py-0.5 rounded-full border border-emerald-100 font-semibold">
                الرياضيات والذكاء الاصطناعي
              </span>
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              متصل الآن لتوجيهك ودراسة الدوال
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleClearChat}
          className="text-slate-600 hover:text-red-600 hover:bg-slate-100 p-2 rounded-lg transition-all duration-200 text-xs flex items-center gap-1.5"
          title="مسح المحادثة وحبذا لو صليت على النبي قبل ذلك!"
        >
          <RefreshCw className="w-4 h-4" />
          <span className="hidden sm:inline">تصفير الشات</span>
        </button>
      </div>

      {/* Main Chat Display Canvas */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-white shrink-0">
        
        {messages.length === 0 ? (
          /* Large Beautiful Welcoming Card with Professor Dali layout */
          <div className="max-w-xl mx-auto text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-black text-slate-800">مرحباً بكل بطل وبطلة في مادة الرياضيات! 🇩🇿 </h2>
              <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 shadow-inner text-slate-700 text-sm md:text-base leading-relaxed">
                {welcomeMessage || "مرحبا بيك خويا اختي انا الاستاذ دالي استاذ مادة رياضيات و مبرمج بذكاء اصطناعي كيفاش نقدر نساعدك؟"}
              </div>
            </div>

            {/* Suggeted Prompt Pills */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block text-right pr-2">
                🎯 أسئلة شائعة لبداية الشرح:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-right">
                {suggestedPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-800 p-3 rounded-xl border border-slate-200 text-right transition-all duration-200 leading-relaxed shadow-sm hover:border-emerald-500/10 active:scale-98"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
            
            <p className="text-[11px] text-slate-400">
              صلي على محمد، وحّد الله، واكتشف شرح الأستاذ دالي المبسط خطوة بخطوة!
            </p>
          </div>
        ) : (
          /* Dynamic Chat message list */
          <div className="space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-4xl ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* Assistant Avatar */}
                {msg.sender === "assistant" && (
                  <img 
                    referrerPolicy="no-referrer"
                    src={profileImageUrl || "https://img.icons8.com/color/150/user-male-circle.png"} 
                    alt="الأستاذ دالي" 
                    className="w-9 h-9 rounded-full object-cover border border-emerald-500 shadow animate-fade-in"
                    onError={(e) => {
                      e.currentTarget.src = "https://img.icons8.com/color/150/user-male-circle.png";
                    }}
                  />
                )}

                {/* Message Body bubble */}
                <div className={`flex flex-col max-w-[85%] ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}>
                  <div
                    className={`p-3.5 rounded-2xl shadow-sm text-sm md:text-base leading-relaxed ${
                      msg.sender === "user"
                        ? "bg-slate-100 text-slate-800 border border-slate-200 rounded-tr-none text-right"
                        : "bg-emerald-600 text-white rounded-tl-none text-right whitespace-pre-line shadow-sm"
                    }`}
                  >
                    {/* Embedded image message if present */}
                    {msg.imageUrl && (
                      <div className="mb-3 rounded-lg overflow-hidden border border-slate-200 max-h-48">
                        <img 
                          referrerPolicy="no-referrer"
                          src={msg.imageUrl} 
                          alt="تم الرفع" 
                          className="object-contain w-full h-full"
                        />
                      </div>
                    )}
                    {msg.text}
                  </div>
                  
                  {/* Message Timestamp */}
                  <span className="text-[10px] text-slate-400 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {/* User Avatar */}
                {msg.sender === "user" && (
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm">
                    طالب
                  </div>
                )}
              </div>
            ))}

            {/* Assistant typing loader simulation */}
            {isSending && (
              <div className="flex gap-3 justify-start animate-pulse">
                <img 
                  referrerPolicy="no-referrer"
                  src={profileImageUrl || "https://img.icons8.com/color/150/user-male-circle.png"} 
                  alt="الأستاذ دالي" 
                  className="w-9 h-9 rounded-full object-cover border border-emerald-500"
                />
                <div className="bg-slate-100 text-slate-600 p-4 rounded-2xl rounded-tl-none border border-slate-200 inline-flex items-center gap-2.5 text-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-300"></span>
                  </div>
                  <span>الأستاذ دالي يكتب ويفصل لك الحل، صلي على محمد...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Message formulation zone */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
        {/* Attachment Image Preview bar */}
        {imagePreviewUrl && (
          <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200 animate-fade-in animate-pulse">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded overflow-hidden border border-slate-200 bg-black">
                <img referrerPolicy="no-referrer" src={imagePreviewUrl} alt="صورة التمرين" className="object-cover w-full h-full" />
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-600 font-bold block">جاهزة للتحليل مع الأستاذ 📸</span>
                <span className="text-[10px] text-slate-500">تنبيه: سيقوم الأستاذ بقراءة نص التمرين وحله بالتفصيل.</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedImageBase64(null);
                setSelectedImageMime(null);
                setImagePreviewUrl(null);
              }}
              className="text-slate-400 hover:text-red-500 p-1 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors text-xs font-semibold"
            >
              إلغاء الصورة
            </button>
          </div>
        )}

        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* File Input */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden"
          />

          {/* Attach file Button */}
          <button
            type="button"
            onClick={triggerImageSelect}
            className="bg-white hover:bg-slate-100 text-slate-600 p-3 rounded-xl transition-all duration-200 border border-slate-200 hover:border-emerald-500/25 shrink-0"
            title="إرفاق صورة التمرين الرياضي للأستاذ"
          >
            <ImageIcon className="w-5 h-5 text-emerald-600" />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="اسأل الأستاذ دالي عن أي دالة، مبرهنة، أو تمرين..."
            className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all duration-200 text-right pr-4"
            disabled={isSending}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSending || (!inputMsg.trim() && !selectedImageBase64)}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800/80 disabled:opacity-50 text-white font-bold p-3 rounded-xl transition-all duration-200 shadow-sm shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 transform rotate-180" />
            )}
          </button>
        </form>
        <div className="flex items-center justify-between px-1 text-[11px] text-slate-400">
          <span>تذكير: بعد كل شرح سيسألك الأستاذ دالي سؤالاً ذكياً لتأكيد الاستيعاب!</span>
          <span className="flex items-center gap-1 font-semibold">
            صلي على محمد وآله وصحبه <span className="text-emerald-500 font-bold">♥</span>
          </span>
        </div>
      </div>
    </div>)}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 disabled:text-emerald-400/50 text-white font-bold p-3 rounded-xl transition-all duration-200 shadow-md shadow-emerald-950/20 shrink-0"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5 transform rotate-180" />
            )}
          </button>
        </form>
        <div className="flex items-center justify-between px-1 text-[11px] text-gray-500">
          <span>تذكير: بعد كل شرح سيسألك الأستاذ دالي سؤالاً ذكياً لتأكيد الاستيعاب!</span>
          <span className="flex items-center gap-1">
            صلي على محمد وآله وصحبه <span className="text-emerald-500">♥</span>
          </span>
        </div>
      </div>
    </div>
  );
}
