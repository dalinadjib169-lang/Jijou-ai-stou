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

// Load Firebase configuration
import firebaseConfig from "./firebase-applet-config.json" with { type: "json" };

const fbApp = initializeApp(firebaseConfig);
const firestoreDb = firebaseConfig.firestoreDatabaseId
  ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(fbApp);

// Core System Instruction for Professor Dali Persona
const SYSTEM_INSTRUCTION = `أنت في كافة الردود تلعب دور "الأستاذ دالي نجيب" (Pro DZ Dali)، أستاذ مادة الرياضيات القدير والمبرمج بالذكاء الاصطناعي من الجزائر.
شخصيتك وعقليتك جزائرية مسلمة، طيبة، مشجعة وسلسة وممتعة.
استخدم عبارات جزائرية وطنية ودينية محببة ووقورة بشكل متوازن وبسيط (مثل: "خويا"، "أختي"، "أهلاً بيك"، "صلي على محمد وجي تتبعني خطوة بخطوة"، "وحد الله وتبع معايا راني هنا لخدمتك"، "هذا سؤال مليح ياسر يعطيك الصحة"، "بارك الله فيك"، "هذا خطأ ما تزيدش تعاودو معليش ذرك تفهمو"، "ربي يبارك فيك الحمد لله كي وضحتلك الفكرة").
طريقة الشرح: يجب أن يكون الشرح تدريجياً، مبسطاً وممنهجاً ومفهومًا جدًا للطالب الجزائري والعربي.
في نهاية كل شرح أو إجابة، اطرح سؤالاً اختبارياً قصيراً جداً يتعلق بما شرحته للتو لتقييم فهم الطالب وتشجيعه على المحاولة.
في نهاية كل رسالة تماماً دون استثناء، يجب أن تنهي بعبارتك الدائمة والمميزة:
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
    const { message, history = [], base64Image, mimeType } = req.body;

    if (!message && !base64Image) {
      return res.status(400).json({ error: "Message or base64 image is required" });
    }

    const allKeys = await getRotatedApiKeys();
    if (allKeys.length === 0) {
      return res.status(500).json({ 
        error: "مفاتيح API الخاصة بـ Gemini غير متوفرة. يرجى إضافتها من لوحة التحكم للأستاذ." 
      });
    }

    // Shuffle keys for uniform hits distribution
    const shuffledKeys = [...allKeys].sort(() => Math.random() - 0.5);
    let lastError: any = null;
    let replyText = "";

    // Loop through keys and try them in randomized sequence
    for (let i = 0; i < shuffledKeys.length; i++) {
      const activeKey = shuffledKeys[i];
      console.log(`[Server Key Rotation] Attempting key ${i + 1}/${shuffledKeys.length}: ${activeKey.substring(0, 10)}...`);

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

        // Map history to Google GenAI structure
        if (Array.isArray(history)) {
          history.forEach((turn: any) => {
            contents.push({
              role: turn.role === "assistant" ? "model" : "user",
              parts: [{ text: turn.text }]
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
        console.warn(`[Server Key Rotation] Key ${i + 1}/${shuffledKeys.length} failed with error: "${err?.message || err}". Trying next key in sequence...`);
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
