import React, { useState, useEffect, useRef } from "react";
import { Sparkles, HelpCircle, ArrowUpRight, Scale, Activity, Sliders, Hash, Info, Play, Keyboard, HelpCircle as QuestionIcon, CornerDownLeft, MessageSquare, Plus, RotateCcw, Loader2 } from "lucide-react";

export default function MathFunctionSection() {
  const [expression, setExpression] = useState("(x^2 - 1) / (x - 2)");
  const [tangentPoint, setTangentPoint] = useState(3);
  const [parameterM, setParameterM] = useState(4);
  const [showTangent, setShowTangent] = useState(true);
  const [showOblique, setShowOblique] = useState(true);
  const [obliqueAsymptoteExpr, setObliqueAsymptoteExpr] = useState("x + 2"); // for (x^2-1)/(x-2) = x + 2 + 3/(x-2)
  const [mValue, setMValue] = useState(0); // sliding param for y = m discussion

  // Intermediate Value Theorem (M.V.T) interval state
  const [intervalA, setIntervalA] = useState(0);
  const [intervalB, setIntervalB] = useState(3.5);

  const [studentQuestion, setStudentQuestion] = useState("");
  const [systemAnswer, setSystemAnswer] = useState<string | null>(null);
  
  // AI Full-Study & Ask states
  const [isStudyingByAi, setIsStudyingByAi] = useState(false);
  const [aiStudyResult, setAiStudyResult] = useState<string | null>(null);
  const [isAskingAi, setIsAskingAi] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse and evaluate a function string for a given x
  const evaluateFunc = (expr: string, x: number): number => {
    try {
      let formatted = expr.toLowerCase();
      formatted = formatted
        .replace(/\s+/g, "")
        .replace(/(\d)\(/g, "$1*(") 
        .replace(/(\d)(x)/g, "$1*$2")
        .replace(/\^/g, "**")
        .replace(/sin/g, "Math.sin")
        .replace(/cos/g, "Math.cos")
        .replace(/tan/g, "Math.tan")
        .replace(/exp/g, "Math.exp")
        .replace(/ln/g, "Math.log")
        .replace(/sqrt/g, "Math.sqrt")
        .replace(/pi/g, "Math.PI")
        .replace(/e\*\*/g, "Math.exp") // handles e^x
        .replace(/([^a-z]|^)e([^a-z]|$)/g, "$1Math.E$2");

      const evaluator = new Function("x", `
        try {
          return ${formatted};
        } catch(e) {
          return NaN;
        }
      `);
      
      const result = evaluator(x);
      return typeof result === "number" && isFinite(result) && !isNaN(result) ? result : NaN;
    } catch (e) {
      return NaN;
    }
  };

  // Determine forbidden values (values of x causing denom = 0 or limits towards infinity)
  const findForbiddenValues = (): number[] => {
    const forbidden: number[] = [];
    const scanMin = -10;
    const scanMax = 10;
    const step = 0.05;
    
    for (let x = scanMin; x <= scanMax; x += step) {
      const val = evaluateFunc(expression, x);
      if (isNaN(val) || !isFinite(val)) {
        const rounded = Math.round(x * 10) / 10;
        if (!forbidden.includes(rounded)) {
          forbidden.push(rounded);
        }
      }
    }
    
    // Heuristics
    const match = expression.match(/\/[-+\s(]*x\s*-\s*(\d+(\.\d+)?)/i);
    if (match) {
      const val = parseFloat(match[1]);
      if (!forbidden.includes(val)) forbidden.push(val);
    }
    const matchPlus = expression.match(/\/[-+\s(]*x\s*\+\s*(\d+(\.\d+)?)/i);
    if (matchPlus) {
      const val = -parseFloat(matchPlus[1]);
      if (!forbidden.includes(val)) forbidden.push(val);
    }

    return forbidden.sort((a,b) => a-b);
  };

  const forbiddenValues = findForbiddenValues();

  // Numerical derivative at point x_0
  const computeDerivative = (x: number): number => {
    const h = 0.0001;
    const yplus = evaluateFunc(expression, x + h);
    const yminus = evaluateFunc(expression, x - h);
    if (isNaN(yplus) || isNaN(yminus)) return NaN;
    return (yplus - yminus) / (2 * h);
  };

  // Draw coordinate system and curves on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Fill with modern clean white background for high density light display
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    
    const scaleX = width / 20; // range from -10 to 10
    const scaleY = height / 20; // range from -10 to 10
    
    const originX = width / 2;
    const originY = height / 2;

    const toPixelX = (x: number) => originX + x * scaleX;
    const toPixelY = (y: number) => originY - y * scaleY;
    const toMathX = (px: number) => (px - originX) / scaleX;

    // 1. Draw Grid Lines (light slate index)
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
    ctx.font = "9px JetBrains Mono, monospace";
    ctx.fillStyle = "#64748b";

    // Vertical grid
    for (let x = -10; x <= 10; x += 1) {
      if (x === 0) continue;
      const px = toPixelX(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
      ctx.fillText(x.toString(), px - 5, originY + 12);
    }

    // Horizontal grid
    for (let y = -10; y <= 10; y += 1) {
      if (y === 0) continue;
      const py = toPixelY(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
      ctx.fillText(y.toString(), originX + 7, py + 3);
    }

    // 2. Draw Key Coordinate Axes
    ctx.strokeStyle = "#94a3b8"; // clean cool slate blue
    ctx.lineWidth = 2;
    
    // X Axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Y Axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    ctx.fillText("0", originX - 10, originY + 12);

    // 3. Draw Parameter discussion: y = m
    const pyM_Line = toPixelY(mValue);
    ctx.strokeStyle = "#ec4899"; // pink 500
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(0, pyM_Line);
    ctx.lineTo(width, pyM_Line);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ec4899";
    ctx.fillText(`y = ${mValue.toFixed(1)} (الوسيط m)`, 12, pyM_Line - 6);

    // 4. Plot Oblique Asymptote: y = obliqueAsymptoteExpr
    if (showOblique && obliqueAsymptoteExpr) {
      ctx.strokeStyle = "#10b981"; // emerald green
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      
      let isFirst = true;
      for (let px = 0; px <= width; px += 5) {
        const mx = toMathX(px);
        const my = evaluateFunc(obliqueAsymptoteExpr, mx);
        if (!isNaN(my)) {
          const py = toPixelY(my);
          if (py >= 0 && py <= height) {
            if (isFirst) {
              ctx.moveTo(px, py);
              isFirst = false;
            } else {
              ctx.lineTo(px, py);
            }
          }
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 5. Plot Forbidden Values (Vertical Asymptote)
    forbiddenValues.forEach(val => {
      const pval = toPixelX(val);
      if (pval >= 0 && pval <= width) {
        ctx.strokeStyle = "#f43f5e"; // rose 500
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pval, 0);
        ctx.lineTo(pval, height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#f43f5e";
        ctx.fillText(`مُقارب عمودي x = ${val}`, pval + 5, 20);
      }
    });

    // 6. Draw Curve f(x)
    ctx.strokeStyle = "#0284c7"; // deep mathematical blue
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let startedNewSegment = true;
    for (let px = 0; px <= width; px++) {
      const mx = toMathX(px);
      const closeToForbidden = forbiddenValues.some(fV => Math.abs(mx - fV) < 0.15);
      const my = evaluateFunc(expression, mx);

      if (!isNaN(my) && isFinite(my) && !closeToForbidden) {
        const py = toPixelY(my);
        if (py >= -100 && py <= height + 100) {
          if (startedNewSegment) {
            ctx.moveTo(px, py);
            startedNewSegment = false;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          startedNewSegment = true;
        }
      } else {
        startedNewSegment = true;
      }
    }
    ctx.stroke();

    // 7. Graph tangent line key
    if (showTangent) {
      const x0 = tangentPoint;
      const y0 = evaluateFunc(expression, x0);
      const derivativeVal = computeDerivative(x0);
      
      if (!isNaN(y0) && !isNaN(derivativeVal)) {
        const px0 = toPixelX(x0);
        const py0 = toPixelY(y0);
        
        ctx.fillStyle = "#d97706"; // amber 600
        ctx.beginPath();
        ctx.arc(px0, py0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`A(${x0}, ${y0.toFixed(1)})`, px0 + 7, py0 - 7);

        ctx.strokeStyle = "#f59e0b"; // amber 500
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        const txStart = -10;
        const tyStart = derivativeVal * (txStart - x0) + y0;
        const txEnd = 10;
        const tyEnd = derivativeVal * (txEnd - x0) + y0;

        ctx.moveTo(toPixelX(txStart), toPixelY(tyStart));
        ctx.lineTo(toPixelX(txEnd), toPixelY(tyEnd));
        ctx.stroke();
      }
    }

  }, [expression, mValue, obliqueAsymptoteExpr, showOblique, forbiddenValues, tangentPoint, showTangent]);

  const insertSymbol = (sym: string) => {
    let toInsert = sym;
    if (sym === "exp") toInsert = "exp(x)";
    else if (sym === "ln") toInsert = "ln(x)";
    else if (sym === "sqrt") toInsert = "sqrt(x)";
    else if (sym === "sin") toInsert = "sin(x)";
    else if (sym === "cos") toInsert = "cos(x)";
    
    if (!inputRef.current) {
      setExpression(prev => prev + toInsert);
      return;
    }

    const start = inputRef.current.selectionStart ?? expression.length;
    const end = inputRef.current.selectionEnd ?? expression.length;
    const newExpr = expression.substring(0, start) + toInsert + expression.substring(end);
    setExpression(newExpr);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const nextPos = start + toInsert.length;
        inputRef.current.setSelectionRange(nextPos, nextPos);
      }
    }, 50);
  };

  const clearExpression = () => {
    setExpression("");
    if (inputRef.current) inputRef.current.focus();
  };

  const getTangentEquation = () => {
    const x0 = tangentPoint;
    const y0 = evaluateFunc(expression, x0);
    const m = computeDerivative(x0);
    if (isNaN(y0) || isNaN(m)) return "غير معرّفة عند هذه النقطة.";
    
    const b = -m * x0 + y0;
    const mStr = m.toFixed(2);
    const bStr = b >= 0 ? `+ ${b.toFixed(2)}` : `- ${Math.abs(b).toFixed(2)}`;
    return `T : y = ${mStr}x ${bStr}`;
  };

  const getCriticalPoints = () => {
    const pts: { x: number; y: number; type: "min" | "max" | "inflection" }[] = [];
    const step = 0.15;
    for (let x = -6.0; x <= 6.0; x += step) {
      const d1 = computeDerivative(x);
      const d2 = computeDerivative(x + step);
      if (!isNaN(d1) && !isNaN(d2)) {
        if (d1 * d2 < 0) {
          const exactX = Math.round((x + step / 2) * 100) / 100;
          const yVal = evaluateFunc(expression, exactX);
          if (!isNaN(yVal)) {
            const leftDer = computeDerivative(exactX - 0.2);
            const rightDer = computeDerivative(exactX + 0.2);
            let type: "min" | "max" = leftDer < 0 && rightDer > 0 ? "min" : "max";
            if (!pts.some(p => Math.abs(p.x - exactX) < 0.5)) {
              pts.push({ x: exactX, y: Math.round(yVal * 100) / 100, type });
            }
          }
        }
      }
    }
    return pts;
  };

  const criticalPointsList = getCriticalPoints();

  const checkMVT_Result = () => {
    const yA = evaluateFunc(expression, intervalA);
    const yB = evaluateFunc(expression, intervalB);
    
    if (isNaN(yA) || isNaN(yB)) {
      return "يرجى اختيار مجال مغلق مستمر لا يحتوي على قيم ممنوعة.";
    }

    const containsForbidden = forbiddenValues.some(val => val > intervalA && val < intervalB);
    if (containsForbidden) {
      return `❌ مبرهنة القيم المتوسطة لا تطبق لأن المجال يحتوي على قيمة ممنوعة (${forbiddenValues.join(", ")}). الدالة غير مستمرة!`;
    }

    const prod = yA * yB;
    if (prod < 0) {
      return `✓ مستمرة ورتيبة: بما أن f(${intervalA}) = ${yA.toFixed(2)} و f(${intervalB}) = ${yB.toFixed(2)} وإشارتاهما متعاكستان (f(a) × f(b) < 0)، فإنه حسب مبرهنة القيم المتوسطة، المعادلة f(x) = 0 تقبل حلاً وحيداً على الأقل في المجال [${intervalA} , ${intervalB}].`;
    } else {
      return `⚠️ الدالتين f(a)=${yA.toFixed(2)} و f(b)=${yB.toFixed(2)} لهما نفس الإشارة. المبرهنة لا تضمن وجود حل قطعي في هذا المجال.`;
    }
  };

  const countParameterSolutions = () => {
    let intersections = 0;
    const step = 0.02;
    let prevDiff = NaN;

    for (let x = -10; x <= 10; x += step) {
      if (forbiddenValues.some(fV => Math.abs(x - fV) < 0.1)) continue;
      
      const val = evaluateFunc(expression, x);
      if (!isNaN(val)) {
        const diff = val - mValue;
        if (!isNaN(prevDiff)) {
          if (prevDiff * diff < 0) {
            intersections++;
          }
        }
        prevDiff = diff;
      }
    }
    return intersections;
  };

  // AI study function representing the core user requirement: "دراسة الدالة بالذكاء الاصطناعي مع حلول وتفاصيل"
  const studyFunctionWithAI = async () => {
    setIsStudyingByAi(true);
    setAiStudyResult(null);
    try {
      const prompt = `أهلاً بك يا أستاذ دالي. أرجو منك دراسة وتحليل الدالة الرياضية التالية دراسة مفصلة ودقيقة مثل باكلوريا الجزائر:
صيغة الدالة: f(x) = ${expression}

يرجى إعطاء شرح تفصيلي خطوة بخطوة باللغة العربية وطريقتك الودودة المشجعة الجزائريية (الأستاذ دالي نجيب):
1. **خطوة 1: النهايات والاتجاه (Limits):** حساب النهايات لـ f(x) عند أطراف مجموعة التعريف، مع توضيح جميع المستقيمات المقاربة (Asymptotes) الأفقية، والعمودية، والمائلة مع معادلاتها الرياضية بدقة (مثال: x = 2، y = x + 2).
2. **خطوة 2: الدالة المشتقة (Derivative):** حساب الدالة المشتقة f'(x) بالتفصيل، وتحديد إشارتها وجدول التغيرات بوضوح.
3. **خطوة 3: معادلة المماس (Tangent):** كتابة معادلة المماس للمنحنى Cf عند النقطة ذات الفاصلة x₀ = ${tangentPoint}.
4. **خطوة 4: مبرهنة القيم المتوسطة (T.V.I):** دراسة وجود حلول المعادلة f(x) = 0 على المجال [${intervalA}, ${intervalB}] بالتطبيق الدقيق للمبرهنة مع الشرح والتبرير.
5. **خطوة 5: دراسة الوسيط m (Parameter Discussion):** مناقشة بيانية وتفصيلية لعدد وإشارة حلول المعادلة f(x) = m (أو تبعاً لوسيط m إن وُجد في المعادلة الأصلية).

أبهر التلميذ بتنظيم رائع، محفز وبخطوات واضحة جداً تسهل الحفظ والفهم، واطرح في النهاية سؤالاً بريئاً لتقييم فهمه، ولا تنسى العبارة الختامية الرائعة.`;

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      const data = await response.json();
      if (data.reply) {
        setAiStudyResult(data.reply);
      } else if (data.error) {
        setAiStudyResult(`عذراً يا بطل، واجهت مشكلة: ${data.error}`);
      } else {
        setAiStudyResult("تعذر الحصول على دراسة تفصيلية من الأستاذ دالي في هذه اللحظة.");
      }
    } catch (error) {
      console.error(error);
      setAiStudyResult("فشل الاتصال بالذكاء الاصطناعي للأستاذ دالي. يرجى التأكد من تشغيل الشبكة ومفتاح API في الإعدادات.");
    } finally {
      setIsStudyingByAi(false);
    }
  };

  // Automated Mathematical Assistant Solver with complete Gemini API integration
  const solveStudentQuestion = async (type: string) => {
    setIsAskingAi(true);
    setSystemAnswer(null);
    try {
      let promptTopic = "";
      if (type === "limits") {
        promptTopic = `احسب واشرح نهايات الدالة f(x) = ${expression} عند أطراف مجال تعريفها بالتفصيل مع مستقيماتها المقاربة.`;
      } else if (type === "critical") {
        promptTopic = `ابحث عن القيم الحدية للدالة f(x) = ${expression} وحساب المشتقة الأولى f'(x) مع دراسة إشارتها وتغير الدالة.`;
      } else if (type === "parity") {
        promptTopic = `ابحث في شفعية الدالة f(x) = ${expression} وتماثل منحنيها البياني بالنسبة للمحاور أو نقطة المبدأ.`;
      } else if (type === "intercepts") {
        promptTopic = `أوجد نقاط تقاطع المنحنى التابع للدالة f(x) = ${expression} مع محوري الفواصل والتراتيب شرحاً رياضياً.`;
      } else if (type === "param") {
        promptTopic = `اشرح وناقش بيانيا حلول المعادلة f(x) = m للوسيط m الحقيقي بالنسبة للمنحنى f(x) = ${expression}.`;
      } else {
        promptTopic = studentQuestion || "اشرح لي كيفية دراسة المنحنى وجدول تغيرات هذه الدالة بالتفصيل.";
      }

      const fullPrompt = `أنت الأستاذ دالي نجيب لمادة الرياضيات. بخصوص الدالة:
f(x) = ${expression}
مجال التعريف: القيم الممنوعة المرصودة هي [${forbiddenValues.join(", ") || "لا توجد"}]
نقطة التماس x₀ = ${tangentPoint}

أجبني كطالب يسأل بفضول علمي عن هذا الموضوع بأسلوبك الجزائري الودود المبهج والأخوي جداً وصلي على محمد في البداية:
"${promptTopic}"`;

      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: fullPrompt }),
      });
      const data = await response.json();
      if (data.reply) {
        setSystemAnswer(data.reply);
      } else if (data.error) {
        setSystemAnswer(`عذراً، حدث خطأ: ${data.error}`);
      } else {
        setSystemAnswer("عذراً بني، لم أستطع صياغة تبرير رياضي في هذه اللحظة. صلي على محمد وحاول مجدداً!");
      }
    } catch (error) {
      console.error(error);
      setSystemAnswer("فشل الاتصال بالذكاء الاصطناعي للأستاذ دالي. يرجى التحقق من لوحة التحكم ومفتاح API في الإعدادات.");
    } finally {
      setIsAskingAi(false);
    }
  };

  // Switch to chat tab carrying the question
  const sendQuestionToChatTab = () => {
    const textToCopy = `أستاذ دالي، بخصوص الدالة f(x) = ${expression}، لدي سؤال: ${studentQuestion || "كيف أقوم بتمثيل جدول التغيرات ودراسة نهاياتها بالتفصيل؟"}`;
    navigator.clipboard.writeText(textToCopy);
    alert("✓ تم نسخ السؤال وصيغة الدالة الحالية إلى حافظتك بنجاح! انتقل الآن لعلامة تبويب 'دردشة الأستاذ دالي' والصقه مباشرة لتكمل نقاشك الذكي 💬");
  };

  // Generate interactive values for the Variation Table
  const generateVariationTableData = () => {
    const pts = [-Infinity];
    forbiddenValues.forEach(v => pts.push(v));
    criticalPointsList.forEach(pt => {
      if (!pts.includes(pt.x)) pts.push(pt.x);
    });
    pts.push(Infinity);
    pts.sort((a,b) => a-b);
    return pts;
  };

  const variationSegments = generateVariationTableData();

  return (
    <div className="space-y-6 text-right">
      
      {/* Top Banner Alert */}
      <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-900/40 flex items-center justify-between gap-3 flex-wrap shadow">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
          <p className="text-xs sm:text-sm font-bold text-slate-300">الراسم التفاعلي المتطور مع جدول التغيرات وبطاقة طرح الأسئلة الذكية 🇩🇿</p>
        </div>
        <div className="text-[11px] bg-emerald-950/70 text-emerald-400 px-2.5 py-1 rounded-lg border border-emerald-900/50 font-bold">
          ثنائي الأبعاد فوري
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Formula control and analytical questions (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main function formula card input */}
          <div className="bg-[#131b2e] p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
            <h3 className="text-white font-black text-base flex items-center gap-2 justify-end">
              تحكم بحدود الدالة f(x)
              <Activity className="w-5 h-5 text-emerald-400" />
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">اكتب صيغة الدالة f(x) هنا:</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-emerald-400 font-serif font-black text-sm">f(x) =</span>
                  <input 
                    ref={inputRef}
                    type="text" 
                    value={expression} 
                    onChange={(e) => setExpression(e.target.value)}
                    placeholder="مثال: (x^2 - 1) / (x - 2)"
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-16 pr-4 py-2.5 text-left font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Study the Function AI Button directly next to formula writing */}
              <button
                onClick={studyFunctionWithAI}
                disabled={isStudyingByAi}
                className="w-full bg-gradient-to-l from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:via-teal-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-75 disabled:cursor-wait cursor-pointer border border-emerald-500/20"
              >
                {isStudyingByAi ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>الأستاذ دالي يقوم بالدراسة الشاملة... صبراً جميل 🧮</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>دراسة الدالة الشاملة بالذكاء الاصطناعي 🧠✨</span>
                  </>
                )}
              </button>

              {/* AI study result display */}
              {aiStudyResult && (
                <div className="bg-[#1e293b] text-right p-4 rounded-xl border border-emerald-500/35 shadow-inner space-y-3">
                  <div className="flex justify-between items-center bg-[#0f172a] -mx-4 -mt-4 px-4 py-2.5 rounded-t-xl border-b border-emerald-700/30">
                    <button 
                      onClick={() => setAiStudyResult(null)}
                      className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-755 px-2 py-0.5 rounded cursor-pointer"
                    >
                      إغلاق ✕
                    </button>
                    <span className="text-emerald-400 font-extrabold text-[11px] sm:text-xs flex items-center gap-1">
                      نتيجة دراسة الدالة - الأستاذ دالي
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-100 whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto pl-1">
                    {aiStudyResult}
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-700/45 pt-2 text-[10px] text-slate-400">
                    <span>صانع الأجيال دالي نجيب 🎓</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(aiStudyResult);
                        alert("✓ تم نسخ تقرير دراسة الدالة بالكامل للحافظة!");
                      }}
                      className="text-[10px] bg-emerald-600 hover:bg-emerald-50 text-white font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      نسخ الشرح الكامل
                    </button>
                  </div>
                </div>
              )}

              {/* Mathematical Shortcut Keyboard Panel */}
              <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-800 space-y-2 transition-colors">
                <span className="text-[10px] sm:text-xs font-bold text-slate-400 flex items-center gap-1 justify-end">
                  لوحة إدخال الرموز والدوال الرياضية السريعة
                  <Keyboard className="w-3.5 h-3.5 text-emerald-400" />
                </span>
                
                <div className="grid grid-cols-5 gap-1.5 font-mono text-xs font-black select-none">
                  <button onClick={() => insertSymbol("exp")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 py-2 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer">eˣ</button>
                  <button onClick={() => insertSymbol("ln")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 py-2 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer">ln(x)</button>
                  <button onClick={() => insertSymbol("^2")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer">x²</button>
                  <button onClick={() => insertSymbol("^3")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer">x³</button>
                  <button onClick={() => insertSymbol("sqrt")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer">√x</button>
                  
                  <button onClick={() => insertSymbol("sin")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer">sin</button>
                  <button onClick={() => insertSymbol("cos")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer">cos</button>
                  <button onClick={() => insertSymbol("pi")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer font-sans">π</button>
                  <button onClick={() => insertSymbol("/")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer font-bold font-sans">/</button>
                  <button onClick={() => insertSymbol("*")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer font-bold font-sans">*</button>

                  <button onClick={() => insertSymbol("+")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer font-bold font-sans">+</button>
                  <button onClick={() => insertSymbol("-")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer font-bold font-sans">-</button>
                  <button onClick={() => insertSymbol("(")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer font-bold font-sans">(</button>
                  <button onClick={() => insertSymbol(")")} className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 border border-slate-700 rounded-lg shadow-sm transition active:scale-95 cursor-pointer font-bold font-sans">)</button>
                  <button onClick={clearExpression} className="bg-rose-950/40 hover:bg-rose-900 border border-rose-900/50 text-rose-400 py-1.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer text-[10px] font-bold">مسح C</button>
                </div>
              </div>

              {/* Sliders for auxiliary evaluation */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">نقطة التماس x₀:</label>
                  <input 
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={tangentPoint}
                    onChange={(e) => setTangentPoint(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 bg-slate-800 rounded-lg h-1.5"
                  />
                  <div className="flex justify-between items-center text-xs text-amber-500 font-mono font-bold mt-1 shadow-sm">
                    <span>{tangentPoint}</span>
                    <span>x₀</span>
                  </div>
                </div>

                <div className="bg-[#131b2e] p-3 rounded-xl border border-slate-805 text-emerald-400 text-xs leading-relaxed">
                  <label className="block text-[11.5px] font-bold text-slate-400 mb-1 text-right">المقارب المائل المقدر y =</label>
                  <input 
                    type="text"
                    value={obliqueAsymptoteExpr}
                    onChange={(e) => setObliqueAsymptoteExpr(e.target.value)}
                    placeholder="مثال: x + 2"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-left font-mono text-emerald-400 text-xs focus:outline-none focus:border-emerald-505"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-800 pt-3 flex-wrap gap-2 text-xs font-bold text-slate-405">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={showTangent}
                    onChange={(e) => setShowTangent(e.target.checked)}
                    className="accent-amber-500 cursor-pointer"
                  />
                  <span>رسم المماس (Orange)</span>
                </label>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={showOblique}
                    onChange={(e) => setShowOblique(e.target.checked)}
                    className="accent-emerald-500 cursor-pointer"
                  />
                  رسم المستقيم المقارب (Green)
                </label>
              </div>
            </div>
          </div>

          {/* Interactive m-parameter horizontal discussion module */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-right space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="bg-pink-100 text-[#ec4899] text-[10px] px-2 py-0.5 rounded-full border border-pink-200 font-bold">تفاعلي</span>
              <span className="text-sm font-black text-slate-800">📊 المناقشة الوسيطية الأفقية (y = m):</span>
            </div>
            
            {/* Horizontal slider for m */}
            <input 
              type="range"
              min="-8"
              max="8"
              step="0.1"
              value={mValue}
              onChange={(e) => setMValue(parseFloat(e.target.value))}
              className="w-full accent-pink-500 bg-slate-50 rounded-lg h-1.5 mb-2"
            />

            <div className="flex justify-between items-center text-xs font-bold text-slate-600 mb-2">
              <span>قيمة m الحالية: <strong className="text-pink-600 font-mono text-sm">{mValue.toFixed(1)}</strong></span>
              <span>عدد نقاط التقاطع: <span className="bg-pink-50 text-[#ec4899] px-2.5 py-0.5 rounded-md border border-pink-100 font-extrabold font-mono text-sm">{countParameterSolutions()}</span></span>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
              تحديد بياني لعدد حلول المعادلة f(x) = m وهو الحل المشترك والتقاطعي بين منحنى الدالة Cf والمستقيم الأفقي الوردي المنقط.
            </p>
          </div>

          {/* Interactive Student Question and AI solver board */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-slate-800 font-black text-base flex items-center gap-2 justify-end">
              المساعد الذكي: اسأل عن الدالة f(x)
              <QuestionIcon className="w-5 h-5 text-emerald-600" />
            </h3>

            <div className="space-y-3">
              <textarea 
                value={studentQuestion}
                onChange={(e) => setStudentQuestion(e.target.value)}
                placeholder="اكتب سؤالك بخصوص الدالة هنا... (مثال: هل الدالة زوجية؟ أو ما هي نقاط التقاطع؟)"
                className="w-full p-3 font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-right leading-relaxed h-16"
              />

              <div className="flex flex-wrap gap-1.5 justify-end">
                <button disabled={isAskingAi} onClick={() => solveStudentQuestion("parity")} className="bg-slate-100 font-bold hover:bg-slate-200 text-slate-600 text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-150 transition select-none disabled:opacity-50">شفعية الدالة؟</button>
                <button disabled={isAskingAi} onClick={() => solveStudentQuestion("intercepts")} className="bg-slate-100 font-bold hover:bg-slate-200 text-slate-600 text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-150 transition select-none disabled:opacity-50">نقاط التقاطع؟</button>
                <button disabled={isAskingAi} onClick={() => solveStudentQuestion("limits")} className="bg-slate-100 font-bold hover:bg-slate-200 text-slate-600 text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-150 transition select-none disabled:opacity-50">النهايات وأطراف Df؟</button>
                <button disabled={isAskingAi} onClick={() => solveStudentQuestion("critical")} className="bg-slate-100 font-bold hover:bg-slate-200 text-slate-600 text-[10px] px-2.5 py-1.5 rounded-lg border border-slate-150 transition select-none disabled:opacity-50">القيم الحدية؟</button>
                <button disabled={isAskingAi} onClick={() => solveStudentQuestion("param")} className="bg-slate-100 font-bold hover:bg-slate-200 text-[#ea580c] text-[10px] px-2.5 py-1.5 rounded-lg border border-orange-200/50 hover:border-orange-300 transition select-none disabled:opacity-50 font-black">المناقشة m؟</button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => solveStudentQuestion("general")}
                  disabled={isAskingAi || !studentQuestion.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1 shadow transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAskingAi ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{isAskingAi ? "مساعد دالي يجيبك..." : "حل السؤال بالـ AI"}</span>
                </button>
                <button 
                  onClick={sendQuestionToChatTab}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 font-bold text-xs py-2.5 px-3 rounded-lg flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>مناقشة بالدردشة 💬</span>
                </button>
              </div>

              {isAskingAi && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-500 text-center animate-pulse">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1.5 text-emerald-600" />
                  <span>يكتب الأستاذ دالي الآن... ترقب الإجابة خطوة بخطوة 🧠✍️</span>
                </div>
              )}

              {systemAnswer && !isAskingAi && (
                <div className="bg-gradient-to-l from-emerald-50/70 to-teal-50/30 border border-emerald-200/60 rounded-xl p-4 text-xs text-slate-700 leading-relaxed text-right space-y-2 max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {systemAnswer}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Graphing Screen and dynamic variations table (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Canvas coordinate plotter card */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 flex-wrap">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-500"></span> f(x)
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500"></span> مقارب مائل
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500"></span> مماس
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-500"></span> الوسيط m
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500"></span> مقارب عمودي
              </div>
              <h4 className="text-slate-800 font-black text-sm">المعلم والمنحنى البياني Cf</h4>
            </div>

            {/* Canvas viewport display */}
            <div className="bg-slate-50 rounded-xl border border-slate-150 overflow-hidden flex items-center justify-center py-1">
              <canvas 
                ref={canvasRef}
                width={500}
                height={400}
                className="max-w-full h-auto cursor-crosshair rounded-xl shadow-sm border border-slate-200"
              />
            </div>
            
            <p className="text-center text-[10px] text-slate-400 font-bold">
              معلم متعامد ومتجانس من -10 إلى +10 على كلا المحورين. يتم الحساب الفوري للإشارات والتقاطعات.
            </p>
          </div>

          {/* Table of Variations - جدول التغيرات تفاعلي وواضح */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-right">
            <div className="flex items-center justify-between pb-2 border-b border-slate-150">
              <span className="text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold font-mono">Df نشيط</span>
              <h4 className="text-slate-800 font-black text-base flex items-center gap-2 justify-end">
                جدول تغيرات الدالة f(x) التفاعلي
                <HelpCircle className="w-5 h-5 text-emerald-600" />
              </h4>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-center text-xs md:text-sm font-bold border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-slate-50 text-slate-600">
                    <th className="border border-slate-200 p-2 w-16">المجال</th>
                    <th className="border border-slate-200 p-2 font-mono">-∞</th>
                    {forbiddenValues.map((fv) => (
                      <React.Fragment key={`fv-${fv}`}>
                        <th className="border border-slate-200 p-2 text-rose-500 font-mono">{fv} (ممنوعة)</th>
                      </React.Fragment>
                    ))}
                    {criticalPointsList.map((pt) => (
                      <React.Fragment key={`crit-${pt.x}`}>
                        <th className="border border-slate-200 p-2 text-amber-600 font-mono">{pt.x} (ذروة)</th>
                      </React.Fragment>
                    ))}
                    <th className="border border-slate-200 p-2 font-mono">+∞</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Derivative Row */}
                  <tr className="text-slate-700 bg-white">
                    <td className="border border-slate-200 p-2 font-black bg-slate-50">إشارة f'(x)</td>
                    <td className="border border-slate-200 p-2 font-mono">
                      {computeDerivative(-5) > 0 ? "+" : "-"}
                    </td>
                    {forbiddenValues.map((fv) => (
                      <React.Fragment key={`fv-d-${fv}`}>
                        <td className="border border-slate-200 p-2 text-rose-500 font-bold font-mono">||</td>
                        <td className="border border-slate-200 p-2 font-mono">
                          {computeDerivative(fv + 0.1) > 0 ? "+" : "-"}
                        </td>
                      </React.Fragment>
                    ))}
                    {criticalPointsList.map((pt) => (
                      <React.Fragment key={`crit-d-${pt.x}`}>
                        <td className="border border-slate-200 p-2 text-amber-600 font-bold font-mono">0</td>
                        <td className="border border-slate-200 p-2 font-mono">
                          {computeDerivative(pt.x + 0.5) > 0 ? "+" : "-"}
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="border border-slate-200 p-2 font-mono"></td>
                  </tr>
                  
                  {/* Function Values & Arrows Row */}
                  <tr className="text-slate-800 bg-slate-50/30">
                    <td className="border border-slate-200 p-3 font-black bg-slate-50">تغيرات f(x)</td>
                    <td className="border border-slate-200 p-3 text-slate-500 text-[10px]">
                      {evaluateFunc(expression, -10) > 0 ? "متناقصة..." : "متزايدة..."}
                    </td>
                    {forbiddenValues.map((fv) => {
                      const leftSign = evaluateFunc(expression, fv - 0.05) > 0 ? "↗" : "↘";
                      const rightSign = evaluateFunc(expression, fv + 0.05) > 0 ? "↗" : "↘";
                      return (
                        <React.Fragment key={`fv-f-${fv}`}>
                          <td className="border-x border-slate-200 p-3 text-rose-500 font-extrabold text-base">||</td>
                          <td className="border border-slate-200 p-3 text-emerald-600 text-sm">
                            {rightSign}
                          </td>
                        </React.Fragment>
                      );
                    })}
                    {criticalPointsList.map((pt) => (
                      <React.Fragment key={`crit-f-${pt.x}`}>
                        <td className="border border-slate-200 p-3 text-amber-600 text-xs">
                          f({pt.x}) = <strong className="font-mono text-slate-800">{pt.y}</strong>
                        </td>
                        <td className="border border-slate-200 p-3 text-emerald-600 text-sm">
                          {computeDerivative(pt.x + 0.5) > 0 ? "↗" : "↘"}
                        </td>
                      </React.Fragment>
                    ))}
                    <td className="border border-slate-200 p-3 text-slate-500 text-[10px]">
                      {evaluateFunc(expression, 10) > evaluateFunc(expression, 5) ? "↗ متزايدة" : "↘ متناقصة"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
              💡 يظهر الرمز <span className="text-rose-500">||</span> خطوط حائطية عمودية دلالة على عدم استمرارية الدالة بسبب وجود قيمة ممنوعة في المقام.
            </p>
          </div>

          {/* Intermediate Value Theorem widget */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="text-slate-800 font-black text-base flex items-center gap-2 justify-end">
              التحقق من مبرهنة القيم المتوسطة (T.V.I)
              <Scale className="w-5 h-5 text-emerald-600" />
            </h4>

            <div className="space-y-3.5">
              <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                ادرس وجود حل صفري للمعادلة f(x) = 0 على مجال محدد [a, b] بمراقبة وتتبع تغيرات إشارة الدالة:
              </p>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">الحد الأقصى للمجال b:</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={intervalB} 
                    onChange={(e) => setIntervalB(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-left font-mono text-slate-800 text-sm focus:outline-none"
                  />
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">الحد الأدنى لـ المجال a:</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={intervalA} 
                    onChange={(e) => setIntervalA(parseFloat(e.target.value) || 0)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1 text-left font-mono text-slate-800 text-sm focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-emerald-50 text-emerald-800 border border-emerald-100 p-4 rounded-xl text-xs md:text-sm leading-relaxed text-right font-medium">
                {checkMVT_Result()}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
