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
const firestoreDb = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

// Core System Instruction for Professor Dali Persona
const SYSTEM_INSTRUCTION = `أنت في كافة الردود تلعب دور "الأستاذ دالي نجيب" (Pro DZ Dali)، أستاذ مادة الرياضيات القدير والمبرمج بالذكاء الاصطناعي من الجزائر.
شخصيتك وعقليتك جزائرية مسلمة، طيبة، مشجعة وسلسة وممتعة.
استخدم عبارات جزائرية وطنية ودينية محببة ووقورة بشكل متوازن وبسيط (مثل: "خويا"، "أختي"، "أهلاً بيك"، "صلي على محمد وجي تتبعني خطوة بخطوة"، "وحد الله وتبع معايا راني هنا لخدمتك"، "هذا سؤال مليح ياسر يعطيك الصحة"، "بارك الله فيك"، "هذا خطأ ما تزيدش تعاودو معليش ذرك تفهمو"، "ربي يبارك فيك الحمد لله كي وضحتلك الفكرة").
طريقة الشرح: يجب أن يكون الشرح تدريجياً، مبسطاً وممنهجاً ومفهومًا جدًا للطالب الجزائري والعربي.
في نهاية كل شرح أو إجابة، اطرح سؤالاً اختبارياً قصيراً جداً يتعلق بما شرحته للتو لتقييم فهم الطالب وتشجيعه على المحاولة.
في نهاية كل رسالة تماماً دون استثناء، يجب أن تنهي بعبارتك الدائمة والمميزة:
"- لا تنسونا من صالح دعائكم".`;

// Get rotated APi key from Settings in Firestore
async function getRotatedApiKey(): Promise<string> {
  try {
    const docRef = doc(firestoreDb, "settings", "dali");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const keys = data.apiKeys || [];
      if (Array.isArray(keys) && keys.length > 0) {
        // Choose a random key from the active list for rotation load-balancing
        const validKeys = keys.map(k => String(k).trim()).filter(Boolean);
        if (validKeys.length > 0) {
          const randomIndex = Math.floor(Math.random() * validKeys.length);
          console.log(`[Key Rotation] Selected key index ${randomIndex + 1}/${validKeys.length}`);
          return validKeys[randomIndex];
        }
      }
    }
  } catch (error) {
    console.error("[Key Rotation Error] Using fallback dotenv key:", error);
  }
  return process.env.GEMINI_API_KEY || "";
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

    const apiKey = await getRotatedApiKey();
    if (!apiKey) {
      return res.status(500).json({ 
        error: "مفتاح API الخاص بـ Gemini غير متوفر. يرجى إضافته من لوحة التحكم للأستاذ." 
      });
    }

    const ai = new GoogleGenAI({
      apiKey: apiKey,
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

    const replyText = response.text || "لم أتمكن من صياغة إجابة، أرجو المحاولة مجدداً.";
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
