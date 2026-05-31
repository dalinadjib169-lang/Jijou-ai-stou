import React, { useState, useEffect, useRef } from "react";
import { Sparkles, HelpCircle, ArrowUpRight, Scale, Activity, Sliders, Hash, Info, Play } from "lucide-react";

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
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(500);
  const [canvasHeight, setCanvasHeight] = useState(400);

  // Parse and evaluate a function string for a given x
  const evaluateFunc = (expr: string, x: number): number => {
    try {
      // General pre-parsing
      let formatted = expr.toLowerCase();
      
      // Standard mathematical transformations
      formatted = formatted
        .replace(/\s+/g, "")
        // Handle parenthesis numbers like 2(x)
        .replace(/(\d)\(/g, "$1*(") 
        // Handle 2x, 5x, etc.
        .replace(/(\d)(x)/g, "$1*$2")
        // Powers replacing e.g., x^2 or (x-1)^2 with standard Javascript pow
        // Let's do general ^ replace with standard JavaScript exponentiation **
        .replace(/\^/g, "**")
        // Support common math functions
        .replace(/sin/g, "Math.sin")
        .replace(/cos/g, "Math.cos")
        .replace(/tan/g, "Math.tan")
        .replace(/exp/g, "Math.exp")
        .replace(/ln/g, "Math.log")
        .replace(/sqrt/g, "Math.sqrt")
        .replace(/pi/g, "Math.PI")
        .replace(/e\*\*/g, "Math.exp") // handles e^x
        .replace(/([^a-z]|^)e([^a-z]|$)/g, "$1Math.E$2");

      // Set up safe context evaluation
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
  // We scan for typical denominators, like (x-a) or x^2-b. We can approximate numerically also.
  const findForbiddenValues = (): number[] => {
    const forbidden: number[] = [];
    // Numerical scan with fine precision to detect division by zero (extreme values)
    const scanMin = -10;
    const scanMax = 10;
    const step = 0.05;
    
    for (let x = scanMin; x <= scanMax; x += step) {
      const val = evaluateFunc(expression, x);
      // If the function produces infinity or extreme localized jump
      if (isNaN(val) || !isFinite(val)) {
        const rounded = Math.round(x * 10) / 10;
        if (!forbidden.includes(rounded)) {
          forbidden.push(rounded);
        }
      }
    }
    
    // Also parse denoms string heuristics directly to be extremely precise
    // E.g., / (x - 2) -> 2
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

  // Numerical derivative at point x_0 using symmetric quotient difference formula 
  const computeDerivative = (x: number): number => {
    const h = 0.0001;
    const yplus = evaluateFunc(expression, x + h);
    const yminus = evaluateFunc(expression, x - h);
    if (isNaN(yplus) || isNaN(yminus)) return NaN;
    return (yplus - yminus) / (2 * h);
  };

  // Draw coordinate system and mathematical curves on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear Canvas
    ctx.clearRect(0,0, canvas.width, canvas.height);
    
    const width = canvas.width;
    const height = canvas.height;
    
    // Scale properties (how many pixels make 1 mathematical unit)
    const scaleX = width / 20; // range from -10 to 10
    const scaleY = height / 20; // range from -10 to 10
    
    const originX = width / 2;
    const originY = height / 2;

    // Convert Math coordinates to Canvas pixel coordinates
    const toPixelX = (x: number) => originX + x * scaleX;
    const toPixelY = (y: number) => originY - y * scaleY;

    // Convert Canvas pixels to Math coordinates
    const toMathX = (px: number) => (px - originX) / scaleX;
    const toMathY = (py: number) => (originY - py) / scaleY;

    // 1. Draw Grid Lines
    ctx.strokeStyle = "#162238";
    ctx.lineWidth = 1;
    ctx.font = "9px JetBrains Mono, monospace";
    ctx.fillStyle = "#4b5563";

    // Vertical grid and text
    for (let x = -10; x <= 10; x += 1) {
      if (x === 0) continue;
      const px = toPixelX(x);
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, height);
      ctx.stroke();
      ctx.fillText(x.toString(), px - 5, originY + 12);
    }

    // Horizontal grid and text
    for (let y = -10; y <= 10; y += 1) {
      if (y === 0) continue;
      const py = toPixelY(y);
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(width, py);
      ctx.stroke();
      ctx.fillText(y.toString(), originX + 7, py + 3);
    }

    // 2. Draw Main Axes (x-axis and y-axis)
    ctx.strokeStyle = "#475569";
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

    // Origin label
    ctx.fillText("0", originX - 10, originY + 12);

    // 3. Draw Parameter Line: y = m (المناقشة الوسيطية)
    const pyM_Line = toPixelY(mValue);
    ctx.strokeStyle = "#ec4899"; // pink color for the slider horizontal intersection parameters
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, pyM_Line);
    ctx.lineTo(width, pyM_Line);
    ctx.stroke();
    ctx.setLineDash([]); // clear dash state
    ctx.fillStyle = "#ec4899";
    ctx.fillText(`y = ${mValue.toFixed(1)} (الوسيط m)`, 12, pyM_Line - 6);

    // 4. Plot Oblique Asymptote: y = obliqueAsymptoteExpr (if valid and checked)
    if (showOblique && obliqueAsymptoteExpr) {
      ctx.strokeStyle = "#10b981"; // elegant green
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

    // 5. Plot Forbidden Values as direct vertical red dashed lines (المقاربات العمودية)
    forbiddenValues.forEach(val => {
      const pval = toPixelX(val);
      if (pval >= 0 && pval <= width) {
        ctx.strokeStyle = "#ef4444"; // bright red for forbidden asymptotes
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pval, 0);
        ctx.lineTo(pval, height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "#ef4444";
        ctx.fillText(`قيمة ممنوعة x = ${val}`, pval + 5, 20);
      }
    });

    // 6. Draw Curve f(x) (المنحنى البياني للدالة)
    ctx.strokeStyle = "#3b82f6"; // beautiful mathematical deep neon blue
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let startedNewSegment = true;
    for (let px = 0; px <= width; px++) {
      const mx = toMathX(px);
      
      // Check proximity to forbidden value to prevent drawing continuous lines straight to infinity
      const closeToForbidden = forbiddenValues.some(fV => Math.abs(mx - fV) < 0.15);
      
      const my = evaluateFunc(expression, mx);
      if (!isNaN(my) && isFinite(my) && !closeToForbidden) {
        const py = toPixelY(my);
        // Ensure values stay moderately in boundary during painting
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

    // 7. Graph tangent line at tangentPoint: y = f'(x0)(x - x0) + f(x0)
    if (showTangent) {
      const x0 = tangentPoint;
      const y0 = evaluateFunc(expression, x0);
      const derivativeVal = computeDerivative(x0);
      
      if (!isNaN(y0) && !isNaN(derivativeVal)) {
        // Draw point on curve
        const px0 = toPixelX(x0);
        const py0 = toPixelY(y0);
        
        ctx.fillStyle = "#f59e0b"; // gold tangent point indicator
        ctx.beginPath();
        ctx.arc(px0, py0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillText(`A(${x0}, ${y0.toFixed(1)})`, px0 + 7, py0 - 7);

        // Draw Tangent line line equation matching: y = slope * (x - x0) + y0
        ctx.strokeStyle = "#f59e0b";
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

  }, [expression, mValue, obliqueAsymptoteExpr, showOblique, forbiddenValues, tangentPoint, showTangent, canvasWidth, canvasHeight]);

  // Compute tangent equation text representation
  const getTangentEquation = () => {
    const x0 = tangentPoint;
    const y0 = evaluateFunc(expression, x0);
    const m = computeDerivative(x0);
    if (isNaN(y0) || isNaN(m)) return "معادلة المماس غير معرّفة عند هذه النقطة.";
    
    // y = m*(x - x0) + y0 => y = m*x - m*x0 + y0
    const b = -m * x0 + y0;
    const mStr = m.toFixed(2);
    const bStr = b >= 0 ? `+ ${b.toFixed(2)}` : `- ${Math.abs(b).toFixed(2)}`;
    return `T : y = ${mStr}x ${bStr}`;
  };

  // Evaluate critical points inside scanning range
  const getCriticalPoints = () => {
    const pts: { x: number; y: number; type: string }[] = [];
    const step = 0.1;
    // scan the interval -6 to 6
    for (let x = -6.0; x <= 6.0; x += step) {
      const d1 = computeDerivative(x);
      const d2 = computeDerivative(x + step);
      if (!isNaN(d1) && !isNaN(d2)) {
        // Sign transition indicates local optimum
        if (d1 * d2 < 0) {
          const exactX = Math.round((x + step/2) * 10) / 10;
          const yVal = evaluateFunc(expression, exactX);
          if (!isNaN(yVal)) {
            // Determine structure if min or max
            const leftDerivative = computeDerivative(exactX - 0.2);
            const rightDerivative = computeDerivative(exactX + 0.2);
            let type = "قيمة حدية";
            if (leftDerivative < 0 && rightDerivative > 0) type = "نهاية صغرى (Minimum)";
            if (leftDerivative > 0 && rightDerivative < 0) type = "نهاية كبرى (Maximum)";
            
            if (!pts.some(p => Math.abs(p.x - exactX) < 0.4)) {
              pts.push({ x: exactX, y: Math.round(yVal * 10) / 10, type });
            }
          }
        }
      }
    }
    return pts;
  };

  const criticalPointsList = getCriticalPoints();

  // Intermediate Value Theorem report verification
  const checkMVT_Result = () => {
    const yA = evaluateFunc(expression, intervalA);
    const yB = evaluateFunc(expression, intervalB);
    
    if (isNaN(yA) || isNaN(yB)) {
      return "يرجى اختيار مجال مغلق مستمر لا يحتوي على قيم ممنوعة.";
    }

    // Check if there's a forbidden value within interval
    const containsForbidden = forbiddenValues.some(val => val > intervalA && val < intervalB);
    if (containsForbidden) {
      return `❌ المبرهنة لا تطبق مباشرة لأن المجال يحتوي على قيمة ممنوعة (${forbiddenValues.join(", ")}). الدالة غير مستمرة!`;
    }

    const prod = yA * yB;
    if (prod < 0) {
      return `✓ مستمرة ورتيبة: بما أن f(${intervalA}) = ${yA.toFixed(2)} و f(${intervalB}) = ${yB.toFixed(2)} وإشارتاهما متعاكستان (f(a) × f(b) < 0)، فإنه حسب مبرهنة القيم المتوسطة، المعادلة f(x) = 0 تقبل حلاً وحيداً على الأقل في المجال [${intervalA} , ${intervalB}].`;
    } else {
      return `⚠️ الدالتين f(a)=${yA.toFixed(2)} و f(b)=${yB.toFixed(2)} لهما نفس الإشارة. قد يوجد حل ولكن المبرهنة لا تضمن وجود حل صفري (f(x)=0) بشكل قاطع على هذا المجال.`;
    }
  };

  // parameter intersections evaluation (y = m lines counts)
  const countParameterSolutions = () => {
    let intersections = 0;
    const step = 0.02;
    let signChanged = false;
    let prevDiff = NaN;

    for (let x = -10; x <= 10; x += step) {
      // ignore if near forbidden
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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left control and text explanations dashboard: 5 columns */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main function formula card input */}
          <div className="bg-[#111c30] p-5 rounded-2xl border border-white/5 shadow-xl text-right">
            <h3 className="text-white font-bold text-lg flex items-center gap-2 justify-end mb-4">
              الرسام والدراسة البيانية f(x)
              <Activity className="w-5 h-5 text-emerald-400" />
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-2">الدالة f(x) المراد دراستها (اكتب الصيغة الرياضية):</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-emerald-400 font-mono font-semibold">f(x) =</span>
                  <input 
                    type="text" 
                    value={expression} 
                    onChange={(e) => setExpression(e.target.value)}
                    placeholder="مثال: (x^2 - 1) / (x - 2)"
                    className="w-full bg-[#0c1322] border border-white/5 rounded-xl pl-16 pr-4 py-2.5 text-left font-mono text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="mt-2 text-[11px] text-gray-400 leading-relaxed">
                  💡 اختصارات ذكية: <code className="text-emerald-400 font-mono font-normal">*</code> للضرب، <code className="text-emerald-400 font-mono font-normal">^</code> للأس، <code className="text-emerald-400 font-mono font-normal">/</code> للقسمة، <code className="text-emerald-500">Math.exp(x)</code> للدالة الأسية $e^x$.
                </div>
              </div>

              {/* Grid with sliders for asymptotes and tangent parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0b1322] p-3 rounded-xl border border-white/5">
                  <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">نقطة التماس x₀:</label>
                  <input 
                    type="range"
                    min="-8"
                    max="8"
                    step="0.5"
                    value={tangentPoint}
                    onChange={(e) => setTangentPoint(parseFloat(e.target.value))}
                    className="w-full accent-amber-500 bg-white/5 rounded-lg h-1.5"
                  />
                  <div className="flex justify-between items-center text-xs text-amber-500 font-mono font-bold mt-1">
                    <span>{tangentPoint}</span>
                    <span>x₀</span>
                  </div>
                </div>

                <div className="bg-[#0b1322] p-3 rounded-xl border border-white/5">
                  <label className="block text-[11px] text-gray-400 mb-1.5 font-medium">المقارب المائل y = </label>
                  <input 
                    type="text"
                    value={obliqueAsymptoteExpr}
                    onChange={(e) => setObliqueAsymptoteExpr(e.target.value)}
                    placeholder="مثال: x + 2"
                    className="w-full bg-[#0c1322] border border-white/5 rounded-lg px-2.5 py-1 text-left font-mono text-emerald-400 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3">
                <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={showTangent}
                    onChange={(e) => setShowTangent(e.target.checked)}
                    className="accent-amber-500 rounded"
                  />
                  رسم المماس (Orange)
                </label>

                <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={showOblique}
                    onChange={(e) => setShowOblique(e.target.checked)}
                    className="accent-emerald-500 rounded"
                  />
                  رسم المستقيم المقارب (Green)
                </label>
              </div>
            </div>
          </div>

          {/* Tabbed Detailed Math Analysis Report Container */}
          <div className="bg-[#111c30] p-5 rounded-2xl border border-white/5 shadow-xl text-right space-y-4">
            <h4 className="text-white font-black text-sm border-b border-white/5 pb-2 uppercase tracking-wide flex items-center justify-end gap-1.5">
              تقرير الدراسة المفصل للدالة f
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </h4>

            <div className="space-y-4 text-xs md:text-sm">
              {/* Forbidden values module */}
              <div className="bg-[#0c1322] p-3.5 rounded-xl border border-red-950/20">
                <span className="text-xs font-bold text-red-400 block mb-1">⚠️ القيم الممنوعة ومجموعة التعريف Df:</span>
                <p className="text-gray-300 leading-relaxed font-mono">
                  {forbiddenValues.length > 0 
                    ? `مجموعة التعريف Df = R - { ${forbiddenValues.join(", ")} } \n (الدالة غير معرفة عند هذه النقاط التي تعدم المقام)`
                    : "الدالة معرفة ومستمرة على كل الأعداد الحقيقية Df = R"
                  }
                </p>
              </div>

              {/* Tangent equation display */}
              <div className="bg-[#0c1322] p-3.5 rounded-xl border border-amber-950/20">
                <span className="text-xs font-bold text-amber-500 block mb-1">📐 معادلة المماس عند النقطة ذات الفاصلة {tangentPoint}:</span>
                <p className="text-gray-300 font-mono leading-relaxed">
                  {getTangentEquation()}
                </p>
                <span className="text-[10px] text-gray-400 mt-1 block">
                  ميل المماس يعبر عن العدد المشتق f'({tangentPoint}) = {computeDerivative(tangentPoint).toFixed(2)}
                </span>
              </div>

              {/* Interactive m-parameter horizontal discussion module */}
              <div className="bg-[#0c1322] p-3.5 rounded-xl border border-pink-950/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="bg-pink-500/10 text-pink-400 text-[10px] px-2 py-0.5 rounded-full border border-pink-500/20">تفاعلي</span>
                  <span className="text-xs font-bold text-pink-400">📊 المناقشة الوسيطية الأفقية (y = m):</span>
                </div>
                
                {/* Horizontal slider for m */}
                <input 
                  type="range"
                  min="-8"
                  max="8"
                  step="0.1"
                  value={mValue}
                  onChange={(e) => setMValue(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 bg-white/5 rounded-lg h-1.5 mb-2.5"
                />

                <div className="flex justify-between items-center text-xs font-semibold text-gray-300 mb-2">
                  <span>قيمة m الحالية: <strong className="text-pink-400 font-mono">{mValue.toFixed(1)}</strong></span>
                  <span>عدد نقاط التقاطع: <span className="bg-pink-500/10 px-2 py-0.5 rounded border border-pink-500/20 font-bold font-mono text-pink-400">{countParameterSolutions()}</span></span>
                </div>

                <p className="text-[11px] text-gray-400 leading-relaxed">
                  تحديد بياني لعدد حلول المعادلة f(x) = m وهو يمثل الإحداثيات الأفقية لتقاطع المنحنى Cf مع المستقيم الأفقي y = m.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Right canvas plotter representation: 7 columns */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Coordinates graph board card wrapper */}
          <div className="bg-[#111c30] p-4 rounded-2xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between px-2 mb-3">
              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500"></span> f(x)
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 ml-2"></span> مقارب مائل
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 ml-2"></span> مماس
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-pink-500 ml-2"></span> الوسيط m
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 ml-2"></span> مقارب عمودي
              </div>
              <h4 className="text-white font-bold text-sm">المعلم ومستوي الرسم Cf</h4>
            </div>

            {/* Canvas screen */}
            <div className="bg-[#090d16] rounded-xl border border-white/5 overflow-hidden flex items-center justify-center">
              <canvas 
                ref={canvasRef}
                width={500}
                height={400}
                className="max-w-full h-auto cursor-crosshair block bg-[#090d16]"
              />
            </div>
            
            <p className="text-center text-[10px] text-gray-500 mt-2.5">
              شبكة ثنائية الأبعاد من -10 إلى +10 على كلا المحورين. يتم إسقاط المستقيمات المقاربة أوتوماتيكياً.
            </p>
          </div>

          {/* Intermediate Value Theorem widget */}
          <div className="bg-[#111c30] p-5 rounded-2xl border border-white/5 shadow-xl text-right space-y-4">
            <h4 className="text-white font-bold text-base flex items-center gap-2 justify-end">
              التحقق من مبرهنة القيم المتوسطة (T.V.I)
              <Scale className="w-5 h-5 text-emerald-400" />
            </h4>

            <div className="space-y-4">
              <p className="text-xs text-gray-300 leading-relaxed">
                ادرس وجود حل للمعادلة f(x) = 0 على مجال محدد [a, b] بمراقبة تغير إشارة الدالة:
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#0b1322] p-3 rounded-xl border border-white/5">
                  <label className="block text-[11px] text-gray-400 mb-1 font-medium">الحد الأقصى للمجال b:</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={intervalB} 
                    onChange={(e) => setIntervalB(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0c1322] border border-white/5 rounded-lg px-3 py-1 text-left font-mono text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="bg-[#0b1322] p-3 rounded-xl border border-white/5">
                  <label className="block text-[11px] text-gray-400 mb-1 font-medium">الحد الأدنى لـ المجال a:</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={intervalA} 
                    onChange={(e) => setIntervalA(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0c1322] border border-white/5 rounded-lg px-3 py-1 text-left font-mono text-white text-sm focus:outline-none"
                  />
                </div>
              </div>

              {/* Result output feedback box */}
              <div className="bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 p-4 rounded-xl text-xs md:text-sm leading-relaxed text-right font-medium">
                {checkMVT_Result()}
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
