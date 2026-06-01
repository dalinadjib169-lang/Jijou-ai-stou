import React, { useState, useEffect, useRef } from "react";
import { Send, Image as ImageIcon, Sparkles, Loader2, RefreshCw, Smartphone, Check, HelpCircle, ArrowDown, Volume2, VolumeX } from "lucide-react";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { Message } from "../types";

interface ChatSectionProps {
  welcomeMessage: string;
  profileImageUrl: string;
  apiKeys?: string[];
  keyRotationMode?: "sequential" | "manual";
  selectedKeyIndex?: number;
}

export default function ChatSection({ 
  welcomeMessage, 
  profileImageUrl, 
  apiKeys,
  keyRotationMode = "sequential",
  selectedKeyIndex = -1
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

  // Web-direct client-side Google API fetch fallback if backend fails (e.g. deployed on static Vercel)
  const callGeminiDirectlyFromBrowser = async (
    text: string,
    history: {role: string; text: string}[],
    base64Image?: string | null,
    mimeType?: string | null
  ): Promise<string> => {
    // 1. Load active rotated API keys and filter out descriptive labels & invalid truncated keys
    const rawKeys = apiKeys || [];
    let cleanKeys = rawKeys.map(k => String(k).trim()).filter(k => k.startsWith("AIzaSy") && !k.includes("...") && !k.includes("…") && !k.includes("."));
    
    // In case no keys start with AIzaSy, get whatever keys are there (excluding labels based on lengths/chars)
    if (cleanKeys.length === 0) {
      cleanKeys = rawKeys.map(k => String(k).trim()).filter(k => k.length > 20 && !k.includes(" ") && !k.includes("_") && !k.includes("...") && !k.includes("…") && !k.includes("."));
    }

    // Try loading fallback from localStorage
    if (cleanKeys.length === 0) {
      try {
        const stored = localStorage.getItem("dali_apiKeys");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            let cleanStored = parsed.map(k => String(k).trim()).filter(k => k.startsWith("AIzaSy") && !k.includes("...") && !k.includes("…") && !k.includes("."));
            if (cleanStored.length === 0) {
              cleanStored = parsed.map(k => String(k).trim()).filter(k => k.length > 20 && !k.includes(" ") && !k.includes("_") && !k.includes("...") && !k.includes("…") && !k.includes("."));
            }
            if (cleanStored.length > 0) {
              cleanKeys = cleanStored;
            }
          }
        }
      } catch (e) {
        console.error("Local load key error:", e);
      }
    }

    if (cleanKeys.length === 0) {
      throw new Error("لا توجد مصفوفة مفاتيح Gemini API مضافة حالياً في لوحة التحكم. يرجى من الأستاذ تسجيل الدخول وإضافة مفتاح لتأمين الخدمة.");
    }

    let keysToTry = cleanKeys;
    if (keyRotationMode === "manual" && selectedKeyIndex >= 0 && selectedKeyIndex < cleanKeys.length) {
      keysToTry = [cleanKeys[selectedKeyIndex]];
      console.log(`[Direct Key Active Select] Manual index active. Using key ${selectedKeyIndex + 1} exclusively in fallback.`);
    } else {
      // Sequential Ordered Automatic Rotation: try keys in list order
      keysToTry = [...cleanKeys];
      console.log(`[Direct Key Active Select] Sequential Auto Active fallback. Trying ${keysToTry.length} keys in list order.`);
    }

    let lastErrorMsg = "";

    // Loop through keysToTry check and try each one until one succeeds
    for (let i = 0; i < keysToTry.length; i++) {
      const activeKey = keysToTry[i];
      console.log(`[Direct Key Rotation] Attempting key ${i + 1}/${keysToTry.length}: ${activeKey.substring(0, 10)}...`);

      try {
        // 2. Format request body conformant to Google REST format
        const formattedContents: any[] = [];
        history.forEach((turn) => {
          formattedContents.push({
            role: turn.role === "assistant" ? "model" : "user",
            parts: [{ text: turn.text }]
          });
        });

        const newParts: any[] = [];
        if (base64Image) {
          newParts.push({
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: base64Image
            }
          });
        }
        if (text) {
          newParts.push({ text: text });
        } else {
          newParts.push({ text: "قم بتحليل هذه الصورة الرياضية وشرحها بالتفصيل خطوة بخطوة." });
        }

        formattedContents.push({
          role: "user",
          parts: newParts
        });

        const SYSTEM_INSTRUCTION = `أنت في كافة الردود تلعب دور "الأستاذ دالي نجيب" (Pro DZ Dali)، أستاذ قدير وخبير متأصل في كافة مواد المنهاج التعليمي الجزائري ومواكب لبرامج قطاع التربية الوطنية بالجزائر، مع تخصص دقيق وعميق استثنائي في مادة الرياضيات والذكاء الاصطناعي.
أسلوبك: أكاديمي تعليمي رصين، مبسط لتسهيل الفهم على التلميذ والمتعلم، بعيد تماماً عن العبارات السوقية أو العامية المبتذلة (مثال: تجنب كلياً عبارات مثل "نسخن الموتور" أو ما شابه)، واستبدلها بعبارات بيداغوجية مشجعة وراقية كوعاء تربوي متين مثل: "دعنا ننشط الذهن بسؤال ذكي ونبسط المفاهيم خطوة بخطوة"، "وحد الله وصلي على رسول الله وتبع معايا راني هنا لخدمتك وتبسيط منهجنا التعليمي".
قواعد لغوية صارمة وهامة:
1. التكيف اللغوي التام والذكي: إذا سألك التلميذ بالدارجة الجزائرية، أجب بلهجة دارجة جزائرية بيداغوجية، وقورة ومحببة ومفهومة. وإذا سألك بالفصحى، فأجب بالكامل باللغة العربية الفصحى السليمة الأكاديمية والواضحة جداً.
2. المنهاج والرياضيات والرموز: ادعم ووجه التلاميذ في جميع المواد التعليمية للمنهاج الجزائري (رياضيات، فيزياء، علوم طبيعية، أدب عربي، تاريخ وجغرافيا، لغات، إلخ)، وخصوصاً الرياضيات. عند كتابة الرموز الرياضية، اكتبها بصيغة واضحة ومفهومة ومطابقة تماماً للمنهاج الجزائري المعتمد. يمنع منعاً باتاً استخدام رمز الدولار ($) أو أي محددات معادلات لاتينية غامضة أو كلمات مثل "times" أو "time" في أسئلتك أو كتابتك، بل اكتب المعادلات والعمليات الحسابية بطريقة وصيغة عربية طبيعية مبسطة ومألوفة للتلميذ الجزائري (مثل: 3 + 3 × 3، أو f(x) = 2x + 1).
3. نهاية الشرح: في نهاية كل شرح أو إجابة لأي سؤال، اطرح سؤالاً اختبارياً قصيراً جداً مناسباً للمستوى التعليمي لتقييم وتثبيت الفهم من طرف الطالب.
4. الخاتمة الدائمة: في نهاية كل رسالة تماماً دون أي استثناء، يجب أن تنهي بعبارتك الدائمة والمميزة:
"- لا تنسونا من صالح دعائكم".`;

        // Use current recommended gemini-3.5-flash model
        const apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${activeKey}`;
        
        const apiResponse = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: formattedContents,
            systemInstruction: {
              parts: [{ text: SYSTEM_INSTRUCTION }]
            },
            generationConfig: {
              temperature: 0.75
            }
          })
        });

        if (!apiResponse.ok) {
          let errMessage = `فشل الاتصال المباشر بخوادم جوجل (كود الحالة: ${apiResponse.status})`;
          try {
            const errBody = await apiResponse.json();
            if (errBody?.error?.message) {
              errMessage = `${errBody.error.message}`;
            }
          } catch (e) {
            try {
              const textExcerpt = await apiResponse.text();
              if (textExcerpt) {
                errMessage = `استجابة غير صالحة من الشبكة: ${textExcerpt.substring(0, 120)}`;
              }
            } catch (_) {}
          }
          throw new Error(errMessage);
        }

        const resJson = await apiResponse.json();
        const resultText = resJson?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!resultText) {
          throw new Error("لم نتمكن من الحصول على رد صحيح من نموذج الذكاء الاصطناعي.");
        }

        // Successfully got a response, return it directly!
        console.log(`[Direct Key Rotation] Key succeeded!`);
        return resultText;

      } catch (keyErr: any) {
        lastErrorMsg = keyErr.message || String(keyErr);
        console.warn(`[Direct Key Rotation] Key ${i + 1}/${keysToTry.length} failed with error: "${lastErrorMsg}". Trying next key in list...`);
        // Continue to check the next key
        continue;
      }
    }

    // If loop finished, all keys failed
    throw new Error(lastErrorMsg || "فشلت جميع مفاتيح الـ API المدورة في جلب الإجابة من خوادم الذكاء الاصطناعي لجوجل.");
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

    const currentBase64 = selectedImageBase64;
    const currentMime = selectedImageMime;

    setSelectedImageBase64(null);
    setSelectedImageMime(null);
    setImagePreviewUrl(null);

    let reply = "";
    let backendSuccess = false;

    // 1. Try querying backend route first (preferred full-stack design)
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
          mimeType: currentMime,
          keyRotationMode,
          selectedKeyIndex
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
          console.warn("Could not parse backend JSON, trying fallback:", jsonErr);
        }
      }
    } catch (err) {
      console.warn("Backend unavailable or timed out, trying fallback:", err);
    }

    // 2. Direct browser-to-Google Gemini API request fallback (needed for static deployment hosts like Vercel)
    if (!backendSuccess) {
      console.info("Executing robust direct browser-to-google API fallback...");
      try {
        reply = await callGeminiDirectlyFromBrowser(
          textToSend,
          messages.map(m => ({ role: m.sender, text: m.text })),
          currentBase64,
          currentMime
        );
      } catch (fallbackErr: any) {
        console.error("Direct fallback failed:", fallbackErr);
        
        let errorHint = fallbackErr.message || String(fallbackErr);
        if (errorHint.includes("Unexpected token") || errorHint.includes("is not valid JSON") || errorHint.includes("fetch")) {
          errorHint = "مفاتيح الـ API المخزنة غير متجاوبة أو انتهت صلاحيتها، أو هناك تعذر في الاتصال المباشر بخوادم جوجل.";
        }

        reply = `يا بني، حدثت مشكلة تقنية صغيرة معي أثناء جلب الجواب:
"${errorHint}"

💡 نصيحة الأستاذ دالي:
1. يرجى التأكد من إضافة مفتاح Gemini API صالح يبدأ بـ "AIzaSy" في لوحة التحكم وحفظ الإعدادات بنجاح.
2. إذا قمت بنشر التطبيق على Vercel، تذكر إضافة المفاتيح في لوحة التحكم الموجودة داخل التطبيق نفسه (لوحة التحكم -> لوحة المفاتيح) لتأمين تفعيلها في بروفايل جهازك الحالي والطلاب وسيعجبك الشرح جداً!`;
      }
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
    <div className="flex flex-col h-[650px] bg-[#131b2e] rounded-1-none rounded-2xl border border-slate-800 shadow-lg overflow-hidden">
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
                     className={`p-4 rounded-2xl shadow-lg text-sm md:text-base leading-relaxed border relative group transition-all duration-300 ${
                       msg.sender === "user"
                         ? "bg-[#111827] text-slate-100 border-slate-800 rounded-tr-none text-right"
                         : "bg-[#1a2436] text-slate-100 border-slate-750 rounded-tl-none text-right whitespace-pre-line shadow-emerald-500/5 hover:border-emerald-400/25"
                     }`}
                   >
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

                     <div className={msg.sender === "assistant" ? "pl-7" : ""}>
                       {msg.text}
                     </div>
                   </div>
                   
                   {/* Message Timestamp */}
                   <span className="text-[10px] text-slate-500 mt-1 px-1 select-none">
                     {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </span>
                 </div>

                {/* User Avatar */}
                {msg.sender === "user" && (
                  <div className="w-9 h-9 rounded-full bg-slate-850 border border-slate-800 text-slate-400 flex items-center justify-center font-bold text-xs shrink-0 select-none">
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
                <div className="bg-slate-800 text-slate-200 p-4 rounded-2xl rounded-tl-none border border-slate-700/60 inline-flex items-center gap-2.5 text-sm/relaxed">
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
      <div className="p-4 bg-[#111827]/80 border-t border-slate-800 space-y-3">
        {/* Attachment Image Preview bar */}
        {imagePreviewUrl && (
          <div className="flex items-center justify-between bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 animate-fade-in animate-pulse">
            <div className="flex items-center gap-2">
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
            className="bg-slate-900 hover:bg-slate-850 text-slate-305 hover:text-white p-3 rounded-xl transition-all duration-200 border border-slate-800 hover:border-cyan-400 hover:shadow-[0_0_12px_rgba(6,182,212,0.4)] shrink-0 cursor-pointer"
            title="إرفاق صورة التمرين الرياضي للأستاذ"
          >
            <ImageIcon className="w-5 h-5 text-cyan-455" />
          </button>

          {/* Text input */}
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="اسأل الأستاذ دالي عن أي دالة، مبرهنة، أو تمرين..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-right pr-4"
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
