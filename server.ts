import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import dotenv from "dotenv";
import crypto from "crypto";

dotenv.config();

const app = express();
const PORT = 3000;

// Solid encryption constants
const ALGORITHM = 'aes-256-cbc';
const SECRET_SALT = process.env.GEMINI_API_KEY || "dali-super-secure-salt-2026-dz-algeria";

function getCipherKey(): Buffer {
  // Hash the salt to always get a 32-byte key
  return crypto.createHash('sha256').update(SECRET_SALT).digest();
}

function encrypt(text: string): string {
  try {
    if (!text) return "";
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, getCipherKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return iv.toString('hex') + ':' + encrypted;
  } catch (err) {
    console.error("Encryption error:", err);
    return text;
  }
}

function decrypt(text: string): string {
  try {
    if (!text) return "";
    const parts = text.split(':');
    if (parts.length !== 2) return text; // Bypass if not encrypted or doesn't follow IV format
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getCipherKey(), iv);
    let decrypted = decipher.update(encryptedText);
    // @ts-ignore
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    // Falls back to backward compatibility for legacy plain keys
    return text;
  }
}

// Check with Firebase Auth endpoint to cryptographically verify bearer token
async function verifyFirebaseToken(idToken: string): Promise<string | null> {
  try {
    if (!idToken) return null;
    const firebaseApiKey = firebaseConfig.apiKey;
    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseApiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    });
    if (!res.ok) {
      console.warn("Firebase ID Token validation returned HTTP status:", res.status);
      return null;
    }
    const data: any = await res.json();
    const email = data?.users?.[0]?.email;
    return email ? email.toLowerCase() : null;
  } catch (e) {
    console.error("Token verification error:", e);
    return null;
  }
}

// Increase payload limit to handle base64 images
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Custom middleware adding robust security headers to protect from common web vulnerabilities
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

import fs from "fs";

// Load Firebase configuration
const firebaseConfig = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "firebase-applet-config.json"), "utf8")
);

const fbApp = initializeApp(firebaseConfig);
const firestoreDb = firebaseConfig.firestoreDatabaseId
  ? getFirestore(fbApp, firebaseConfig.firestoreDatabaseId)
  : getFirestore(fbApp);

const LOCAL_SETTINGS_PATH = path.join(process.cwd(), "dali-settings-fallback.json");

// Helper to write settings to local fallback file
function writeLocalSettings(data: any) {
  try {
    fs.writeFileSync(LOCAL_SETTINGS_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch (e) {
    console.error("Failed to write fallback settings locally:", e);
  }
}

// Helper to read settings from local fallback file
function readLocalSettings(): any {
  try {
    if (fs.existsSync(LOCAL_SETTINGS_PATH)) {
      return JSON.parse(fs.readFileSync(LOCAL_SETTINGS_PATH, "utf8"));
    }
  } catch (e) {
    console.error("Failed to read fallback settings locally:", e);
  }
  return null;
}

// Global active flag indicating whether Firestore is fully provisioned & working
let isFirestoreWorking = false;

// Async self-invoking function to test if Firestore is working on startup
async function checkFirestoreStatus() {
  try {
    const docRef = doc(firestoreDb, "settings", "dali");
    await getDoc(docRef);
    isFirestoreWorking = true;
    console.log("🔥 [Firebase Status] Firestore database found and verified successfully.");
  } catch (err: any) {
    isFirestoreWorking = false;
    console.warn("⚠️ [Firebase Status] Firestore database not working or permission denied. Bypassing active calls to prevent RPC error noise.");
  }
}

// Run the Firestore availability check on startup
checkFirestoreStatus();

// Unified secure settings read function
async function getSettingsData(): Promise<any> {
  const fallbackDefaults = {
    welcomeMessage: "مرحبا بيك خويا اختي انا الاستاذ دالي استاذ مادة رياضيات و مبرمج بذكاء اصطناعي كيفاش نقدر نساعدك؟",
    profileImageUrl: "https://img.icons8.com/color/150/user-male-circle.png",
    keyRotationMode: "sequential",
    selectedKeyIndex: -1,
    apiKeys: []
  };

  if (!isFirestoreWorking) {
    const local = readLocalSettings();
    return local || fallbackDefaults;
  }

  try {
    const docRef = doc(firestoreDb, "settings", "dali");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        welcomeMessage: data.welcomeMessage || fallbackDefaults.welcomeMessage,
        profileImageUrl: data.profileImageUrl || fallbackDefaults.profileImageUrl,
        keyRotationMode: data.keyRotationMode || fallbackDefaults.keyRotationMode,
        selectedKeyIndex: typeof data.selectedKeyIndex === "number" ? data.selectedKeyIndex : fallbackDefaults.selectedKeyIndex,
        apiKeys: Array.isArray(data.apiKeys) ? data.apiKeys : []
      };
    }
  } catch (err) {
    console.warn("[Get Settings DB Error] Reading local fallback:", err);
  }

  const local = readLocalSettings();
  return local || fallbackDefaults;
}

// Unified secure settings write function
async function saveSettingsData(payload: {
  welcomeMessage: string;
  profileImageUrl: string;
  apiKeys: string[];
  keyRotationMode: string;
  selectedKeyIndex: number;
}): Promise<boolean> {
  // Always update locally as a durable backup
  writeLocalSettings(payload);

  if (!isFirestoreWorking) {
    console.log("[Settings Cache] Settings saved locally (Firestore offline/inactive).");
    return true;
  }

  try {
    const docRef = doc(firestoreDb, "settings", "dali");
    await setDoc(docRef, payload);
    console.log("[Settings Cache] Settings saved successfully in Firestore.");
    return true;
  } catch (err) {
    console.error("[Settings Cache DB Write Error]:", err);
    return false;
  }
}

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
    const data = await getSettingsData();
    const keys = data.apiKeys || [];
    if (Array.isArray(keys)) {
      // Decrypt the keys first before validating
      const decryptedKeys = keys.map(k => decrypt(String(k).trim()));

      // Filter keys starting with AIzaSy or having key characteristics and not containing masking dots
      let validKeys = decryptedKeys.map(k => String(k).trim())
        .filter(k => k.startsWith("AIzaSy") && !k.includes(".") && !k.includes("...") && !k.includes("…"));
      
      if (validKeys.length === 0) {
        validKeys = decryptedKeys.map(k => String(k).trim())
          .filter(k => k.length > 20 && !k.includes(" ") && !k.includes("_") && !k.includes(".") && !k.includes("...") && !k.includes("…"));
      }
      validKeys.forEach(k => {
        if (!candidateKeys.includes(k)) {
          candidateKeys.push(k);
        }
      });
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
      const d = await getSettingsData();
      if (d.keyRotationMode) docMode = d.keyRotationMode;
      if (typeof d.selectedKeyIndex === "number") docIndex = d.selectedKeyIndex;
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
      if (!activeKey || typeof activeKey !== "string") {
        console.warn(`[Server Key Rotation] Warning: API key at index ${i} is empty or not a string.`);
        continue;
      }

      const keyDisplay = activeKey.substring(0, 10);
      console.log(`[Server Key Rotation] Attempting key ${i + 1}/${keysToTry.length}: ${keyDisplay}...`);

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
            if (!turn || typeof turn !== "object") return;
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

        // Sanitize and alternate roles in contents list to prevent validation errors
        let finalizedContents: any[] = [];
        for (const item of contents) {
          const hasTextParts = item.parts && item.parts.some((p: any) => p.text || p.inlineData);
          if (hasTextParts) {
            finalizedContents.push(item);
          }
        }

        // Compact consecutive items of the same role
        const consolidated: any[] = [];
        for (const turn of finalizedContents) {
          if (consolidated.length > 0 && consolidated[consolidated.length - 1].role === turn.role) {
            consolidated[consolidated.length - 1].parts = [
              ...consolidated[consolidated.length - 1].parts,
              ...turn.parts
            ];
          } else {
            consolidated.push(turn);
          }
        }

        // Ensure conversation has strictly alternating roles
        let cleanHistory: any[] = [];
        let expectedRole = "user";
        for (const turn of consolidated) {
          if (turn.role === expectedRole) {
            cleanHistory.push(turn);
            expectedRole = expectedRole === "user" ? "model" : "user";
          } else {
            if (cleanHistory.length > 0) {
              const prev = cleanHistory[cleanHistory.length - 1];
              prev.parts = [...prev.parts, ...turn.parts];
            } else if (turn.role === "user") {
              cleanHistory.push(turn);
              expectedRole = "model";
            }
          }
        }

        // Finally, make sure the last item in cleanHistory is a user turn so model can reply
        while (cleanHistory.length > 0 && cleanHistory[cleanHistory.length - 1].role !== "user") {
          cleanHistory.pop();
        }

        if (cleanHistory.length === 0) {
          cleanHistory.push({
            role: "user",
            parts: newParts
          });
        }

        // Generate output with gemini-3.5-flash and fallback to gemini-3.1-flash-lite
        let response;
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: cleanHistory,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.75,
            }
          });
        } catch (firstModelErr: any) {
          const errMsg = firstModelErr?.message || String(firstModelErr);
          const isDemandOrQuota = errMsg.includes("demand") || errMsg.includes("quota") || errMsg.includes("overloaded") || errMsg.includes("limit") || errMsg.includes("exhausted") || errMsg.includes("429");
          console.warn(`[Server] gemini-3.5-flash failed: "${errMsg}". Fallback condition: ${isDemandOrQuota}`);
          
          if (isDemandOrQuota) {
            console.log("[Server] Falling back to stable model: gemini-3.1-flash-lite");
            response = await ai.models.generateContent({
              model: "gemini-3.1-flash-lite",
              contents: cleanHistory,
              config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                temperature: 0.75,
              }
            });
          } else {
            throw firstModelErr;
          }
        }

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

// Secure endpoint to serve public welcome configurations to students without exposing any API keys
app.get("/api/public/config", async (req: any, res: any) => {
  try {
    const data = await getSettingsData();
    return res.json({
      welcomeMessage: data.welcomeMessage || "مرحباً بكم يا أبطال في منصة الأستاذ دالي!",
      profileImageUrl: data.profileImageUrl || "https://img.icons8.com/color/150/user-male-circle.png",
      keyRotationMode: data.keyRotationMode || "sequential",
      selectedKeyIndex: typeof data.selectedKeyIndex === "number" ? data.selectedKeyIndex : -1,
    });
  } catch (err) {
    console.warn("[REST Config Load Warning]:", err);
  }

  // Fallback safe configuration
  res.json({
    welcomeMessage: "مرحباً بكم يا أبطال في منصة الأستاذ دالي!",
    profileImageUrl: "https://img.icons8.com/color/150/user-male-circle.png",
    keyRotationMode: "sequential",
    selectedKeyIndex: -1
  });
});

// Secure endpoint for the authenticated Admin to get settings with MASKED keys
app.get("/api/admin/get-settings", async (req: any, res: any) => {
  try {
    const idToken = req.query.idToken || "";
    const email = await verifyFirebaseToken(idToken);
    
    // Check if verified admin
    const isAdmin = email && (email === "dalind1990@gmail.com" || email === "dalinadjib169@gmail.com");
    if (!isAdmin) {
      return res.status(403).json({ error: "عذراً يا بني، أنت غير مصرح لك بقراءة هذه الإعدادات الخاصة بالأستاذ." });
    }

    const data = await getSettingsData();
    const rawApiKeys = data.apiKeys || [];
    
    // Decrypt stored keys and mask them for display safety
    const maskedApiKeys = rawApiKeys.map((k: string) => {
      const decrypted = decrypt(k);
      if (decrypted.length > 12) {
        return `${decrypted.substring(0, 8)}...${decrypted.substring(decrypted.length - 4)}`;
      }
      return decrypted;
    });

    return res.json({
      welcomeMessage: data.welcomeMessage || "مرحباً بكم يا أبطال في منصة الأستاذ دالي!",
      profileImageUrl: data.profileImageUrl || "https://img.icons8.com/color/150/user-male-circle.png",
      keyRotationMode: data.keyRotationMode || "sequential",
      selectedKeyIndex: typeof data.selectedKeyIndex === "number" ? data.selectedKeyIndex : -1,
      apiKeys: maskedApiKeys // safe masked keys
    });

  } catch (error: any) {
    console.error("[Get Settings Error]:", error);
    res.status(500).json({ error: "فشل استرجاع البيانات الآمنة." });
  }
});

// Secure endpoint for the authenticated Admin to save settings with encrypted keys
app.post("/api/admin/save-settings", async (req: any, res: any) => {
  try {
    const { idToken, welcomeMessage, profileImageUrl, apiKeys = [], keyRotationMode, selectedKeyIndex } = req.body;
    const email = await verifyFirebaseToken(idToken);

    const isAdmin = email && (email === "dalind1990@gmail.com" || email === "dalinadjib169@gmail.com");
    if (!isAdmin) {
      return res.status(403).json({ error: "عذراً يا بني، أنت غير مصرح لك بتعديل هذه الإعدادات الخاصة بالأستاذ." });
    }

    // 1. We must handle keys carefully because the frontend might send back masked keys (e.g. AIzaSy...4xZ)
    // We should read the existing database keys first to preserve those unchanged!
    const existingData = await getSettingsData();
    const originalEncryptedKeys: string[] = existingData.apiKeys || [];

    const decryptedOriginalKeys = originalEncryptedKeys.map(k => decrypt(k));

    // 2. Map and encrypt inputs
    const encryptedKeysToSave = apiKeys.map((keyInput: string) => {
      const trimmed = String(keyInput).trim();
      
      // If the incoming key is masked (has "..."), it means it was not edited by the Admin.
      // We should locate its original match from the existing database keys!
      if (trimmed.includes("...")) {
        const indexMatch = apiKeys.indexOf(keyInput);
        if (indexMatch >= 0 && indexMatch < decryptedOriginalKeys.length) {
          // Use the original encrypted key directly
          return originalEncryptedKeys[indexMatch];
        }
        // Fallback default
        return trimmed;
      }

      // If it's a completely new plain text key, encrypt it securely!
      if (trimmed.startsWith("AIzaSy") || trimmed.length > 20) {
        return encrypt(trimmed);
      }

      // Keep it as is or encrypt it
      return encrypt(trimmed);
    });

    const payload = {
      welcomeMessage: welcomeMessage || "مرحباً بكم يا أبطال في منصة الأستاذ دالي!",
      profileImageUrl: profileImageUrl || "https://img.icons8.com/color/150/user-male-circle.png",
      apiKeys: encryptedKeysToSave,
      keyRotationMode: keyRotationMode || "sequential",
      selectedKeyIndex: typeof selectedKeyIndex === "number" ? selectedKeyIndex : -1
    };

    const success = await saveSettingsData(payload);
    if (!success) {
      throw new Error("Failed to save settings variables.");
    }

    console.log(`[Admin Security] Saved settings for admin ${email}. Keys saved securely: ${encryptedKeysToSave.length}`);
    res.json({ success: true });

  } catch (error: any) {
    console.error("[Save Settings Error]:", error);
    res.status(500).json({ error: "فشل حفظ وتأمين الإعدادات." });
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
