import React, { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, Sparkles, Loader2, RefreshCw, Smartphone, Check, HelpCircle, ArrowDown, Volume2, VolumeX } from "lucide-react";
import { Message } from "../types";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface ChatSectionProps {
  isDarkMode?: boolean;
  welcomeMessage: string;
  profileImageUrl: string;
  apiKeys?: string[];
  keyRotationMode?: "sequential" | "manual";
  selectedKeyIndex?: number;
  onDeductPoint?: () => boolean;
}

export default function ChatSection({ 
  welcomeMessage, 
  profileImageUrl, 
  apiKeys,
  keyRotationMode = "sequential",
  selectedKeyIndex = -1,
  isDarkMode = true,
  onDeductPoint
}: ChatSectionProps) {
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
  
  // Voice output state & function for confident master tutoring
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState<boolean>(false);

  const speakText = (text: string, msgId: string) => {
    if (!("speechSynthesis" in window)) {
      alert("ميزة نطق الشرح غير مدعومة بالكامل على متصفحك الحالي.");
      return;
    }

    try {
      // Cancel active voice playbacks
      window.speechSynthesis.cancel();

      if (speakingMsgId === msgId) {
        setSpeakingMsgId(null);
        return;
      }

      // Strip emojis and metadata parameters for elegant vocal reading
      const speakable = text
        .replace(/🇩🇿|⭐|🔍|⚡|🛡️|💬|📖/g, "")
        .replace(/-\s*لا تنسونا من صالح دعائكم/g, "لا تنسونا من صالح دعائكم")
        .trim();

      const utterance = new SpeechSynthesisUtterance(speakable);
      utterance.lang = "ar-SA"; // Warm Algerian / Saudi pedagogic dialect accent fallback
      
      const voices = window.speechSynthesis.getVoices();
      // Look for a confident clear male voice or standard Arabic engine
      const arabicVoice = voices.find(
        (v) =>
          v.lang.startsWith("ar") &&
          (v.name.includes("Male") || v.name.includes("Maged") || v.name.includes("Naeem") || v.name.toLowerCase().includes("male") || !v.name.toLowerCase().includes("female"))
      );
      if (arabicVoice) {
        utterance.voice = arabicVoice;
      }
      utterance.rate = 0.92; // Serene steady rate for educational clear comprehension
      utterance.pitch = 0.98; // Confident male voice level

      utterance.onend = () => {
        setSpeakingMsgId(null);
      };
      utterance.onerror = () => {
        setSpeakingMsgId(null);
      };

      setSpeakingMsgId(msgId);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error(e);
      setSpeakingMsgId(null);
    }
  };
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);



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

  // Handle Send Message
  const handleSendMessage = async () => {
    if ((!inputMsg.trim() && !selectedImageBase64) || isSending) return;

    const textToSend = inputMsg;
    const currentBase64 = selectedImageBase64;
    const currentMime = selectedImageMime;

    // Build the user message
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
      timestamp: new Date(),
      imageUrl: imagePreviewUrl || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMsg("");
    setIsSending(true);

    if (onDeductPoint) {
      const allowed = onDeductPoint();
      if (!allowed) {
        setIsSending(false);
        return;
      }
    }

    setSelectedImageBase64(null);
    setSelectedImageMime(null);
    setImagePreviewUrl(null);

    let reply = "";
    let backendSuccess = false;

    // 1. Try querying backend route first
    try {
      const API_URL = "";
      const response = await fetch(`${API_URL}/api/gemini/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({
            role: m.sender,
            text: m.text
          })),
          base64Image: currentBase64,
          mimeType: currentMime,
        })
      });

      const contentType = response.headers.get("content-type") || "";
      if (response.ok && !contentType.includes("text/html")) {
        try {
          const resData = await response.json();
          if (resData && resData.reply) {
            reply = resData.reply;
            backendSuccess = true;
          }
        } catch (jsonErr) {
          console.warn("Could not parse backend JSON:", jsonErr);
        }
      } else if (!response.ok && !contentType.includes("text/html")) {
        try {
          const resData = await response.json();
          if (resData && resData.error) {
            reply = "الخادم يقول: " + resData.error;
            backendSuccess = true; // We successfully got an error message from backend
          }
        } catch (jsonErr) {}
      }
    } catch (err) {
      console.warn("Backend unavailable or timed out:", err);
    }

    // If backend fails, we show an error message

    if (!backendSuccess) {
      reply = "عذراً يا بني، حدثت مشكلة في الاتصال بالخادم. يرجى المحاولة مرة أخرى أو التأكد من إعدادات Vercel.";
    }

    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: "assistant",
      text: reply,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, assistantMessage]);
    setIsSending(false);

    // Auto-voice description playback if enabled
    if (isVoiceEnabled) {
      // Small timeout to allow render completion
      setTimeout(() => {
        speakText(reply, assistantMessage.id);
      }, 50);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  return (
    <div className="flex flex-col h-[650px] bg-[#131b2e] md:rounded-2xl md:border md:border-slate-800 md:shadow-lg overflow-hidden">
      {/* Top Profile Header */}
      <div className="bg-slate-900/60 px-4 md:px-5 py-3.5 flex flex-col xs:flex-row items-center justify-between border-b border-slate-800 gap-3">
        <div className="flex items-center gap-3.5 text-right w-full xs:w-auto">
          <div className="relative">
            {/* Pulsating Neon Green Profile border around Avatar */}
            <img 
              referrerPolicy="no-referrer"
              src={profileImageUrl || "https://img.icons8.com/color/150/user-male-circle.png"} 
              alt="الأستاذ دالي" 
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400 shadow-[0_0_15px_#10b981] md:shadow-[0_0_18px_#10b981] animate-pulse hover:scale-105 hover:shadow-[0_0_20px_#06b6d4] hover:border-cyan-400 transition-all duration-300"
              onError={(e) => {
                e.currentTarget.src = "https://img.icons8.com/color/150/user-male-circle.png";
              }}
            />
            {/* Algeria Flag next to Avatar */}
            <span className="absolute bottom-0 right-0 text-xl leading-none px-1 py-0.5 bg-slate-950/80 rounded-full border border-slate-800 select-none" title="الجزائر 🇩🇿">🇩🇿</span>
          </div>
          <div>
            <h3 className="font-black text-white text-base md:text-lg flex items-center gap-2">
              الأستاذ دالي نجيب 
              <span className="bg-emerald-950/80 text-emerald-400 text-[10px] md:text-xs px-2 py-0.5 rounded-full border border-emerald-900/30 font-semibold select-none">
                المنهاج الجزائري
              </span>
            </h3>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]"></span>
              متصل لتوجيهك في جميع المواد والرياضيات 📖
            </p>
          </div>
        </div>
        
        {/* Actions Bar: Robot Voice Synthesis toggle and Reset buttons */}
        <div className="flex items-center justify-end gap-2 w-full xs:w-auto shrink-0">
          {/* Confident Robot Voice toggle with neon indicator */}
          <button
            type="button"
            onClick={() => {
              const current = !isVoiceEnabled;
              setIsVoiceEnabled(current);
              if (!current && window.speechSynthesis) {
                window.speechSynthesis.cancel();
                setSpeakingMsgId(null);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 text-xs font-bold shrink-0 cursor-pointer ${
              isVoiceEnabled
                ? "bg-gradient-to-r from-emerald-950/80 to-teal-950/80 text-emerald-400 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.35)] animate-pulse"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-705"
            }`}
            title="تفعيل أو كتم الصوت الروبوتي للأستاذ دالي"
          >
            {isVoiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isVoiceEnabled ? "نطق الإجابة مفعل" : "تفعيل نطق الأستاذ"}</span>
          </button>

          <button 
            type="button"
            onClick={handleClearChat}
            className="text-slate-450 hover:text-red-400 bg-slate-900 hover:bg-slate-850 p-2 rounded-xl transition-all duration-200 text-xs flex items-center gap-1.5 border border-slate-800 hover:border-red-500/25 hover:shadow-[0_0_10px_rgba(239,68,68,0.25)] cursor-pointer shrink-0"
            title="مسح المحادثة وحبذا لو صليت على النبي قبل ذلك!"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">مسح الشات</span>
          </button>
        </div>
      </div>

      {/* Main Chat Display Canvas */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-[#0e1424] shrink-0 font-sans">
        
        {messages.length === 0 ? (
          /* Large Beautiful Welcoming Card with Professor Dali layout */
          <div className="max-w-xl mx-auto text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10 animate-bounce">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            
            <div className="space-y-3">
              <h2 className="text-xl md:text-2xl font-black text-white">مرحباً بكل بطل وبطلة في مادة الرياضيات! 🇩🇿 </h2>
              <div className="bg-slate-900/80 p-5 rounded-xl border border-slate-800/80 shadow-inner text-slate-100 text-sm md:text-base leading-relaxed font-semibold">
                {welcomeMessage || "مرحبا بيك خويا اختي انا الاستاذ دالي استاذ مادة رياضيات و مبرمج بذكاء اصطناعي كيفاش نقدر نساعدك؟"}
              </div>
            </div>

            <p className="text-[12px] text-slate-400">
              صلي على محمد، وحّد الله، واكتشف شرح الأستاذ دالي المبسط خطوة بخطوة! اكتب سؤالك أو مشكلتك الرياضية بالأسفل وسيتكفل الأستاذ بالشرح المفصل.
            </p>
          </div>
        ) : (
          /* Dynamic Chat message list */
          <div className="space-y-5">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className="flex w-full"
              >
                {/* Assistant avatar moved inside the bubble */}

                 {/* Message Body bubble */}
                 <div className="flex flex-col w-full items-start">
                   <div
                     className={`relative group transition-all duration-300 w-full ${
                       msg.sender === "user"
                         ? "p-4 rounded-2xl shadow-lg text-sm md:text-base leading-relaxed border bg-[#111827] text-slate-100 border-slate-800 rounded-tr-none text-right"
                         : "p-4 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed border bg-[#1a2436] text-slate-100 border-slate-750 text-right whitespace-pre-line shadow-emerald-500/5 hover:border-emerald-400/25"
                     }`}
                   >
                     {msg.sender === "assistant" && (
                       <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/50">
                         <img 
                           referrerPolicy="no-referrer"
                           src={profileImageUrl || "https://img.icons8.com/color/150/user-male-circle.png"} 
                           alt="الأستاذ دالي" 
                           className="w-8 h-8 shrink-0 rounded-full object-cover border border-emerald-500 shadow animate-fade-in"
                           onError={(e) => {
                             e.currentTarget.src = "https://img.icons8.com/color/150/user-male-circle.png";
                           }}
                         />
                         <span className="font-bold text-emerald-400 text-sm md:text-base">الأستاذ دالي</span>
                       </div>
                     )}
                     {msg.sender === "user" && (
                       <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-800/80">
                         <div className="w-8 h-8 rounded-full bg-slate-850 border border-slate-800 text-slate-400 flex items-center justify-center font-bold text-[10px] shrink-0 select-none">
                           طالب
                         </div>
                         <span className="font-bold text-teal-400 text-sm md:text-base">أنت (طالب)</span>
                       </div>
                     )}
                     {/* Embedded image message if present */}
                     {msg.imageUrl && (
                       <div className="mb-3 rounded-lg overflow-hidden border border-slate-800 max-h-48">
                         <img 
                           referrerPolicy="no-referrer"
                           src={msg.imageUrl} 
                           alt="تم الرفع" 
                           className="object-contain w-full h-full"
                         />
                       </div>
                     )}
                     
                     {/* Voice Button embedded in teacher messages */}
                     {msg.sender === "assistant" && (
                       <div className="absolute top-2 left-2 opacity-80 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                         <button
                           type="button"
                           onClick={() => speakText(msg.text, msg.id)}
                           className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                             speakingMsgId === msg.id
                               ? "bg-emerald-900 border-emerald-500 text-emerald-400 shadow-[0_0_8px_#10b981]"
                               : "bg-slate-900 border-slate-800 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/35"
                           }`}
                           title="تشغيل نطق أو شرح الأستاذ دالي"
                         >
                           <Volume2 className={`w-3.5 h-3.5 ${speakingMsgId === msg.id ? "animate-pulse" : ""}`} />
                         </button>
                       </div>
                     )}

                     <div className={`${msg.sender === "assistant" ? "pl-7" : ""} prose prose-sm max-w-full overflow-hidden break-words ${isDarkMode ? 'text-white prose-invert prose-headings:text-emerald-400 prose-a:text-amber-400 prose-strong:text-white prose-pre:bg-slate-900 prose-pre:border-slate-800' : 'text-slate-800 prose-headings:text-emerald-700 prose-a:text-emerald-600 prose-strong:text-slate-900 prose-pre:bg-slate-100 prose-pre:border-slate-200'} prose-p:leading-relaxed markdown-body text-right`} style={{ direction: "rtl" }}>
                       <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                         {msg.text}
                       </Markdown>
                     </div>
                   </div>
                   
                   {/* Message Timestamp */}
                   <span className="text-[10px] text-slate-500 mt-1 px-1 select-none">
                     {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                 </div>

                
              </div>
            ))}

            {/* Assistant typing loader simulation */}
            {isSending && (
              <div className="flex justify-center w-full animate-fade-in mt-4">
                <div className="w-full flex flex-col items-start">
                   <div className="p-4 md:p-5 rounded-2xl text-sm md:text-base leading-relaxed border bg-[#1a2436] text-slate-100 border-slate-750 text-right shadow-emerald-500/5 w-full">
                     <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700/50">
                       <img 
                         referrerPolicy="no-referrer"
                         src={profileImageUrl || "https://img.icons8.com/color/150/user-male-circle.png"} 
                         alt="الأستاذ دالي" 
                         className="w-8 h-8 shrink-0 rounded-full object-cover border border-emerald-500 shadow animate-fade-in"
                       />
                       <span className="font-bold text-emerald-400 text-sm md:text-base">الأستاذ دالي</span>
                     </div>
                     <div className="inline-flex items-center gap-2.5">
                       <div className="flex gap-1">
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-75"></span>
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-150"></span>
                         <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce delay-300"></span>
                       </div>
                       <span>الأستاذ دالي يكتب ويفصل لك الحل، صلي على محمد...</span>
                     </div>
                   </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input Message formulation zone */}
      <div className="p-4 bg-[#111827]/80 border-t border-slate-800 space-y-3">
        {/* Attachment Image Preview bar */}
        {imagePreviewUrl && (
          <div className="flex items-center justify-between bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 animate-fade-in animate-pulse">
            <div className="flex items-center gap-2 w-full">
              <div className="w-10 h-10 rounded overflow-hidden border border-slate-800 bg-black">
                <img referrerPolicy="no-referrer" src={imagePreviewUrl} alt="صورة التمرين" className="object-cover w-full h-full" />
              </div>
              <div className="text-right">
                <span className="text-xs text-emerald-400 font-bold block">جاهزة للتحليل مع الأستاذ 📸</span>
                <span className="text-[10px] text-slate-400">تنبيه: سيقوم الأستاذ بقراءة نص التمرين وحله بالتفصيل.</span>
              </div>
            </div>
            <button 
              onClick={() => {
                setSelectedImageBase64(null);
                setSelectedImageMime(null);
                setImagePreviewUrl(null);
              }}
              className="text-slate-400 hover:text-red-400 p-1 bg-slate-800 hover:bg-slate-750 rounded-lg transition-colors text-xs font-semibold"
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
          className="flex items-center gap-2 w-full"
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
            className="bg-slate-900 hover:bg-slate-850 text-slate-305 hover:text-white p-3 rounded-xl transition-all duration-200 border border-slate-800 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] shrink-0 cursor-pointer"
            title="إرفاق صورة التمرين الرياضي للأستاذ"
          >
            <ImageIcon className="w-5 h-5 text-cyan-455" />
          </button>

          {/* Text input */}
          <textarea
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="اسأل الأستاذ دالي هنا..."
            className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-right pr-4 resize-none h-12 md:h-14"
            disabled={isSending}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSending || (!inputMsg.trim() && !selectedImageBase64)}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:opacity-40 text-white font-bold p-3 rounded-xl transition-all duration-200 shadow-sm shadow-emerald-500/25 hover:shadow-[0_0_15px_#10b981] hover:scale-103 shrink-0 cursor-pointer border border-emerald-500/20"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
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
    </div>
  );
}
