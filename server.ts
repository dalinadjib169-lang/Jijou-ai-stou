import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase payload limit to handle base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

import fs from "fs";

// Load Firebase configuration
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8")
);

const fbApp = initializeApp(firebaseConfig);
const firestoreDb = firebaseConfig.firestoreDatabaseId
  ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(fbApp);

// Core System Instruction for Professor Dali Persona
const SYSTEM_INSTRUCTION = `أنت في كافة الردود تلعب دور "الأستاذ دالي نجيب" (Pro DZ Dali)، أستاذ قدير وخبير متأصل في كافة مواد المنهاج التعليمي الجزائري ومواكب لبرامج قطاع التربية الوطنية بالجزائر، مع تخصص دقيق وعميق استثنائي في مادة الرياضيات والذكاء الاصطناعي.
أسلوبك: أكاديمي تعليمي رصين، مبسط لتسهيل الفهم على التلميذ والمتعلم، بعيد تماماً عن العبارات السوقية أو العامية المبتذلة (مثال: تجنب كلياً عبارات مثل "نسخن الموتور" أو ما شابه)، واستبدلها بعبارات بيداغوجية مشجعة وراقية كوعاء تربوي متين مثل: "دعنا ننشط الذهن بسؤال ذكي ونبسط المفاهيم خطوة بخطوة"، "وحد الله وصلي على رسول الله وتبع معايا راني هنا لخدمتك وتبسيط منهجنا التعليمي".
قواعد لغوية صارمة وهامة:
1. التكيف اللغوي التام والذكي: إذا سألك التلميذ بالدارجة الجزائرية، أجب بلهجة دارجة جزائرية بيداغوجية، وقورة ومحببة ومفهومة. وإذا سألك بالفصحى، فأجب بالكامل باللغة العربية الفصحى السليمة الأكاديمية والواضحة جداً.
2. المنهاج والرياضيات والرموز: ادعم ووجه التلاميذ في جميع المواد التعليمية للمنهاج الجزائري (رياضيات، فيزياء، علوم طبيعية، أدب عربي، تاريخ وجغرافيا، لغات، إلخ)، وخصوصاً الرياضيات. عند كتابة الرموز الرياضية، اكتبها بصيغة واضحة ومفهومة ومطابقة تماماً للمنهاج الجزائري المعتمد. يمنع منعاً باتاً استخدام رمز الدولار ($) أو أي محددات معادلات لاتينية غامضة أو كلمات مثل "times" أو "time" في أسئلتك أو كتابتك، بل اكتب المعادلات والعمليات الحسابية بطريقة وصيغة عربية طبيعية مبسطة ومألوفة للتلميذ الجزائري (مثل: 3 + 3 × 3، أو f(x) = 2x + 1).
3. نهاية الشرح: في نهاية كل شرح أو إجابة لأي سؤال، اطرح سؤالاً اختبارياً قصيراً جداً مناسباً للمستوى التعليمي لتقييم وتثبيت الفهم من طرف الطالب.
4. الخاتمة الدائمة: في نهاية كل رسالة تماماً دون أي استثناء، يجب أن تنهي بعبارتك الدائمة والمميزة:
"- لا تنسونا من صالح دعائكم".`;

// Get all rotated API keys from Settings in Firestore and dynamic process environment variables
async function getRotatedApiKeys(): Promise<string[]> {
  const candidateKeys: string[] = [];

  // 1. Gather any environment variables starting with AIzaSy (covers any custom Vercel or environment names)
  try {
    for (const [key, value] of Object.entries(process.env)) {
      if (value && typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.startsWith("AIzaSy") && !trimmed.includes(".") && !trimmed.includes("...") && !trimmed.includes("…")) {
          candidateKeys.push(trimmed);
        }
      }
    }
  } catch (e) {
    console.warn("Error scanning process.env keys:", e);
  }

  // 2. Gather active keys from Firestore rotation settings
  try {
    const docRef = doc(firestoreDb, "settings", "dali");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const keys = data.apiKeys || [];
      if (Array.isArray(keys)) {
        // Filter keys starting with AIzaSy or having key characteristics and not containing masking dots
        let validKeys = keys.map(k => String(k).trim())
          .filter(k => k.startsWith("AIzaSy") && !k.includes(".") && !k.includes("...") && !k.includes("…"));
        
        if (validKeys.length === 0) {
          validKeys = keys.map(k => String(k).trim())
            .filter(k => k.length > 20 && !k.includes(" ") && !k.includes("_") && !k.includes(".") && !k.includes("...") && !k.includes("…"));
        }
        validKeys.forEach(k => {
          if (!candidateKeys.includes(k)) {
            candidateKeys.push(k);
          }
        });
      }
    }
  } catch (error) {
    console.warn("[Key Rotation Firestore Error] Fallback env keys used:", error);
  }

  // 3. Fallback to standard GEMINI_API_KEY if found and valid
  const defaultKey = (process.env.GEMINI_API_KEY || "").trim();
  if (defaultKey && defaultKey.startsWith("AIzaSy") && !defaultKey.includes(".") && !defaultKey.includes("...") && !defaultKey.includes("…") && !candidateKeys.includes(defaultKey)) {
    candidateKeys.push(defaultKey);
  }

  return Array.from(new Set(candidateKeys)).filter(Boolean);
}

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date() });
});

// Chat completion with Dali AI (incorporating persona and image understanding)
app.post("/api/gemini/chat", async (req: any, res: any) => {
  try {
    const { message, history = [], base64Image, mimeType, keyRotationMode, selectedKeyIndex } = req.body;

    if (!message && !base64Image) {
      return res.status(400).json({ error: "Message or base64 image is required" });
    }

    // Try reading active rotation config from Firestore settings/dali document in real-time
    let docMode = "sequential";
    let docIndex = -1;
    try {
      const docRef = doc(firestoreDb, "settings", "dali");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const d = docSnap.data();
        if (d.keyRotationMode) docMode = d.keyRotationMode;
        if (typeof d.selectedKeyIndex === "number") docIndex = d.selectedKeyIndex;
      }
    } catch (e) {
      console.warn("Could not read dynamic mode options from Firestore:", e);
    }

    // Prioritize request body parameters passed in real-time from client state
    const mode = keyRotationMode !== undefined ? keyRotationMode : docMode;
    const selectedIdx = selectedKeyIndex !== undefined ? Number(selectedKeyIndex) : docIndex;

    const allKeys = await getRotatedApiKeys();
    if (allKeys.length === 0) {
      return res.status(500).json({ 
        error: "مفاتيح API الخاصة بـ Gemini غير متوفرة. يرجى إضافتها من لوحة التحكم للأستاذ." 
      });
    }

    let keysToTry: string[] = [];
    if (mode === "manual" && selectedIdx >= 0 && selectedIdx < allKeys.length) {
      keysToTry = [allKeys[selectedIdx]];
      console.log(`[Server Key Active Select] Manual index active. Using key ${selectedIdx + 1} exclusively: ${keysToTry[0].substring(0, 10)}...`);
    } else {
      // Sequential Ordered Automatic Rotation: try keys in exact sequence list order
      keysToTry = [...allKeys];
      console.log(`[Server Key Active Select] Sequential Auto Active. Trying ${keysToTry.length} keys in list order.`);
    }

    let lastError: any = null;
    let replyText = "";

    // Loop through keys and try them in sequence
    for (let i = 0; i < keysToTry.length; i++) {
      const activeKey = keysToTry[i];
      console.log(`[Server Key Rotation] Attempting key ${i + 1}/${keysToTry.length}: ${activeKey.substring(0, 10)}...`);

      try {
        const ai = new GoogleGenAI({
          apiKey: activeKey,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build",
            }
          }
        });

        // Construct chat content history conforming to contents parameter
        const contents: any[] = [];

        // Map history to Google GenAI structure with strict alternating role safety
        if (Array.isArray(history)) {
          history.forEach((turn: any) => {
            const isModel = turn.role === "assistant" || turn.role === "model" || turn.role === "dali";
            contents.push({
              role: isModel ? "model" : "user",
              parts: [{ text: turn.text || "" }]
            });
          });
        }

        // New Turn Parts
        const newParts: any[] = [];
        if (base64Image) {
          newParts.push({
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: base64Image
            }
          });
        }
        if (message) {
          newParts.push({ text: message });
        } else {
          newParts.push({ text: "قم بتحليل هذه الصورة الرياضية وشرحها بالتفصيل خطوة بخطوة." });
        }

        contents.push({
          role: "user",
          parts: newParts
        });

        // Generate output
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.75,
          }
        });

        const textOutput = response.text || "";
        if (textOutput) {
          replyText = textOutput;
          lastError = null;
          break; // Key succeeded! Stop rotation.
        } else {
          throw new Error("لم نتمكن من الحصول على رد صحيح من نموذج الذكاء الاصطناعي.");
        }

      } catch (err: any) {
        lastError = err;
        console.warn(`[Server Key Rotation] Key ${i + 1}/${keysToTry.length} failed with error: "${err?.message || err}". Trying next key in sequence...`);
        // Continue to check the next key in the loop
        continue;
      }
    }

    if (lastError || !replyText) {
      return res.status(500).json({
        error: lastError?.message || "فشلت جميع مفاتيح الـ API المدورة في جلب الإجابة من خوادم الذكاء الاصطناعي لجوجل."
      });
    }

    res.json({ reply: replyText });

  } catch (error: any) {
    console.error("[Chat Error]:", error);
    res.status(500).json({ 
      error: error?.message || "حدث خطأ غير متوقع أثناء معالجة طلبك." 
    });
  }
});

// Setup Vite Dev Middleware or Production Static Serve
async function bootstrap() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Pro DZ Dali Server] Running at http://localhost:${PORT}`);
  });
}

bootstrap();
