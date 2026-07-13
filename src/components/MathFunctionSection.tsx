import React, { useState, useEffect, useRef } from "react";
import { Sparkles, HelpCircle, ArrowUpRight, Scale, Activity, Sliders, Hash, Info, Play, Keyboard, HelpCircle as QuestionIcon, CornerDownLeft, MessageSquare, Plus, RotateCcw, Loader2 } from "lucide-react";
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';

interface MathFunctionSectionProps {
  isDarkMode?: boolean;
  apiKeys?: string[];
  keyRotationMode?: "sequential" | "manual";
  selectedKeyIndex?: number;
  onDeductPoint?: () => boolean;
}

export default function MathFunctionSection({
  apiKeys = [],
  keyRotationMode = "sequential",
  selectedKeyIndex = -1,
  isDarkMode = true,
  onDeductPoint
}: MathFunctionSectionProps) {
  const [expression, setExpression] = useState("(x^2 - 1) / (x - 2)");
  const [tangentPoint, setTangentPoint] = useState(3);
  const [parameterM, setParameterM] = useState(4);
  const [showTangent, setShowTangent] = useState(true);
  const [showOblique, setShowOblique] = useState(true);
  const [obliqueAsymptoteExpr, setObliqueAsymptoteExpr] = useState("x + 2"); // for (x^2-1)/(x-2) = x + 2 + 3/(x-2)
  const [mValue, setMValue] = useState(0); // sliding param for y = m discussion

  // Custom states added for general m equation discussion & custom asymptotes
  const [mEquation, setMEquation] = useState("m"); 
  const [customHorizAsymptote, setCustomHorizAsymptote] = useState("");
  const [customVertAsymptote, setCustomVertAsymptote] = useState("");
  const [showHorizAsymptote, setShowHorizAsymptote] = useState(true);
  const [showVertAsymptote, setShowVertAsymptote] = useState(true);
  const [isStudyingMByAi, setIsStudyingMByAi] = useState(false);
  const [mStudyResult, setMStudyResult] = useState<string | null>(null);

  // Intermediate Value Theorem (M.V.T) interval state
  const [intervalA, setIntervalA] = useState(0);
  const [intervalB, setIntervalB] = useState(3.5);

  const [studentQuestion, setStudentQuestion] = useState("");
  const [systemAnswer, setSystemAnswer] = useState<string | null>(null);
  
  // AI Full-Study & Ask states
  const [isStudyingByAi, setIsStudyingByAi] = useState(false);
  const [aiStudyResult, setAiStudyResult] = useState<string | null>(null);
  const [studyFollowUpText, setStudyFollowUpText] = useState("");
  const [studyFollowUpHistory, setStudyFollowUpHistory] = useState<{ role: "student" | "dali"; text: string }[]>([]);
  const [isStudyFollowUpLoading, setIsStudyFollowUpLoading] = useState(false);
  const [isAskingAi, setIsAskingAi] = useState(false);
  const [subTab, setSubTab] = useState<"plotter" | "analytical">("plotter");

  // AI-generated variation table states
  const [variationTableMode, setVariationTableMode] = useState<"instant" | "ai">("instant");
  const [isGeneratingAiTable, setIsGeneratingAiTable] = useState(false);
  const [aiTableData, setAiTableData] = useState<any>(null);
  const [aiTableError, setAiTableError] = useState<string | null>(null);
  const [aiStudiedExpression, setAiStudiedExpression] = useState<string>("");
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse and evaluate a function string for a given x
  const evaluateFunc = (expr: string, x: number): number => {
    try {
      let cleanExpr = expr.trim();
      if (cleanExpr.includes("=")) {
        cleanExpr = cleanExpr.split("=").pop() || "";
      }
      
      let formatted = cleanExpr.toLowerCase();
      formatted = formatted
        .replace(/\s+/g, "")
        .replace(/(\d)([a-z])/g, "$1*$2") // Handles 2x, 2sin, 2cos, etc.
        .replace(/(\d)\(/g, "$1*(")       // Handles 2(x+1)
        .replace(/\)([\d(a-z])/g, ")*$1")  // Handles (x+1)2, etc.
        .replace(/\^/g, "**");

      const evaluator = new Function("x", `
        const e = Math.E;
        const pi = Math.PI;
        const sin = Math.sin;
        const cos = Math.cos;
        const tan = Math.tan;
        const exp = Math.exp;
        const ln = Math.log;
        const log = Math.log;
        const sqrt = Math.sqrt;
        const abs = Math.abs;
        const pow = Math.pow;
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

  // Parse and evaluate an expression with both variable x and parameter m
  const evaluateFuncWithM = (expr: string, x: number, m: number): number => {
    try {
      let cleanExpr = expr.trim();
      if (cleanExpr.includes("=")) {
        cleanExpr = cleanExpr.split("=").pop() || "";
      }
      
      let formatted = cleanExpr.toLowerCase();
      formatted = formatted
        .replace(/\s+/g, "")
        .replace(/(\d)([a-z])/g, "$1*$2") // Handles 2x, 2m, etc.
        .replace(/(\d)\(/g, "$1*(")       // Handles 2(x+1)
        .replace(/\)([\d(a-z])/g, ")*$1")
        .replace(/\^/g, "**");

      const evaluator = new Function("x", "m", `
        const e = Math.E;
        const pi = Math.PI;
        const sin = Math.sin;
        const cos = Math.cos;
        const tan = Math.tan;
        const exp = Math.exp;
        const ln = Math.log;
        const log = Math.log;
        const sqrt = Math.sqrt;
        const abs = Math.abs;
        const pow = Math.pow;
        try {
          return ${formatted};
        } catch(e) {
          return NaN;
        }
      `);
      
      const result = evaluator(x, m);
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
        // A point is a true forbidden value only if it's a boundary or single discontinuity,
        // which means the function must be defined immediately to its left or to its right.
        const leftVal = evaluateFunc(expression, x - 0.15);
        const rightVal = evaluateFunc(expression, x + 0.15);
        const isNeighbourDefined = (!isNaN(leftVal) && isFinite(leftVal)) || (!isNaN(rightVal) && isFinite(rightVal));

        if (isNeighbourDefined) {
          const rounded = Math.round(x * 10) / 10;
          if (!forbidden.includes(rounded)) {
            forbidden.push(rounded);
          }
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

    // 3. Draw Parameter discussion: complete equation with m
    ctx.strokeStyle = "#ec4899"; // pink 500
    ctx.lineWidth = 2.0;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    
    let isFirstM = true;
    for (let px = 0; px <= width; px += 2) {
      const mx = toMathX(px);
      const my = evaluateFuncWithM(mEquation, mx, mValue);
      if (!isNaN(my) && isFinite(my)) {
        const py = toPixelY(my);
        if (py >= 0 && py <= height) {
          if (isFirstM) {
            ctx.moveTo(px, py);
            isFirstM = false;
          } else {
            ctx.lineTo(px, py);
          }
        }
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw dynamic equation label near the left/top of the graph
    const initialMathX = -8;
    const initialMathY = evaluateFuncWithM(mEquation, initialMathX, mValue);
    if (!isNaN(initialMathY) && isFinite(initialMathY)) {
      ctx.fillStyle = "#ec4899";
      ctx.font = "bold 10px Inter, sans-serif";
      ctx.fillText(`y = ${mEquation.replace(/\*/g, "·")} [m = ${mValue.toFixed(2)}]`, 12, toPixelY(initialMathY) - 8);
    }

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

      // label oblique
      ctx.fillStyle = "#10b981";
      ctx.font = "normal 10px Inter, sans-serif";
      const yAtObliqueLabel = evaluateFunc(obliqueAsymptoteExpr, 6);
      if (!isNaN(yAtObliqueLabel)) {
        ctx.fillText(`(Δ): y = ${obliqueAsymptoteExpr}`, toPixelX(6) + 5, toPixelY(yAtObliqueLabel) - 5);
      }
    }

    // 4b. Draw Custom Horizontal Asymptote: y = customHorizAsymptote
    if (showHorizAsymptote && customHorizAsymptote) {
      const hVal = parseFloat(customHorizAsymptote);
      if (!isNaN(hVal)) {
        const pyH = toPixelY(hVal);
        if (pyH >= 0 && pyH <= height) {
          ctx.strokeStyle = "#0d9488"; // teal 600
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, pyH);
          ctx.lineTo(width, pyH);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#0d9488";
          ctx.fillText(`مُقارب أفقي y = ${hVal}`, 15, pyH - 6);
        }
      }
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

    // 5b. Plot Custom Vertical Asymptotes: x = customVertAsymptote
    if (showVertAsymptote && customVertAsymptote) {
      const vValues = customVertAsymptote.split(",").map(s => parseFloat(s.trim())).filter(val => !isNaN(val));
      vValues.forEach(val => {
        const pval = toPixelX(val);
        if (pval >= 0 && pval <= width) {
          ctx.strokeStyle = "#db2777"; // pink-600
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(pval, 0);
          ctx.lineTo(pval, height);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = "#db2777";
          ctx.fillText(`مُقارب عمودي مخصص x = ${val}`, pval + 5, 40);
        }
      });
    }

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

  }, [expression, mValue, mEquation, obliqueAsymptoteExpr, showOblique, forbiddenValues, tangentPoint, showTangent, customHorizAsymptote, customVertAsymptote, showHorizAsymptote, showVertAsymptote]);

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

  const getSortedKeyPoints = () => {
    const points: { x: number; label?: string; isForbidden: boolean; isCritical: boolean; isTangent: boolean }[] = [];
    
    // Add forbidden values
    forbiddenValues.forEach(v => {
      if (!points.some(p => Math.abs(p.x - v) < 0.05)) {
        points.push({ x: v, label: "قيمة ممنوعة", isForbidden: true, isCritical: false, isTangent: false });
      }
    });

    // Add critical points
    criticalPointsList.forEach(cp => {
      if (!points.some(p => Math.abs(p.x - cp.x) < 0.05)) {
        const roundedX = Math.round(cp.x * 100) / 100;
        points.push({ x: roundedX, label: cp.type === "max" ? "ذروة كبرى" : "ذروة صغرى", isForbidden: false, isCritical: true, isTangent: false });
      }
    });

    // Add tangent point (student input x0)
    if (showTangent && typeof tangentPoint === "number" && !isNaN(tangentPoint)) {
      const existing = points.find(p => Math.abs(p.x - tangentPoint) < 0.05);
      if (existing) {
        existing.isTangent = true;
        existing.label = existing.label ? `${existing.label} + نقطة تماس` : "نقطة التماس x₀";
      } else {
        const roundedTangent = Math.round(tangentPoint * 100) / 100;
        points.push({ x: roundedTangent, label: "نقطة التماس x₀", isForbidden: false, isCritical: false, isTangent: true });
      }
    }

    // Sort by x coordinate ascending
    points.sort((a, b) => a.x - b.x);
    return points;
  };

  const getDynamicVariationPoints = () => {
    const pts = getSortedKeyPoints();
    const columns: any[] = [];
    
    // Start with -∞ point
    const yMinusInf = evaluateFunc(expression, -20);
    let limitMinusInf = "-∞";
    if (!isNaN(yMinusInf) && isFinite(yMinusInf)) {
      limitMinusInf = yMinusInf.toFixed(1);
    } else {
      const nearLeft = evaluateFunc(expression, -15);
      const farLeft = evaluateFunc(expression, -25);
      if (!isNaN(nearLeft) && !isNaN(farLeft)) {
        limitMinusInf = nearLeft > farLeft ? "+∞" : "-∞";
      }
    }
    
    columns.push({
      type: "point",
      x: "-∞",
      f_prime: "",
      f_val: limitMinusInf,
      is_boundary: true
    });
    
    for (let i = 0; i < pts.length; i++) {
      const currentPt = pts[i];
      // Interval before this point
      const prevX = i === 0 ? -12 : pts[i - 1].x;
      const midX = (prevX + currentPt.x) / 2;
      const derivSign = computeDerivative(midX);
      const isUp = isNaN(derivSign) ? (evaluateFunc(expression, currentPt.x - 0.15) < evaluateFunc(expression, currentPt.x)) : (derivSign > 0);
      
      columns.push({
        type: "arrow",
        f_prime: isUp ? "+" : "-",
        direction: isUp ? "up" : "down"
      });
      
      // The point itself
      const fValNumber = evaluateFunc(expression, currentPt.x);
      const fValStr = currentPt.isForbidden ? "||" : (isNaN(fValNumber) || !isFinite(fValNumber) ? "||" : fValNumber.toFixed(1));
      const fPrimeStr = currentPt.isForbidden ? "||" : (currentPt.isCritical ? "0" : (computeDerivative(currentPt.x).toFixed(1)));
      
      columns.push({
        type: "point",
        x: currentPt.x.toString(),
        label: currentPt.label,
        f_prime: fPrimeStr,
        f_val: fValStr,
        is_forbidden: currentPt.isForbidden,
        is_peak: currentPt.isCritical,
        is_tangent: currentPt.isTangent
      });
    }
    
    // Last Interval
    const lastX = pts.length > 0 ? pts[pts.length - 1].x : 0;
    const midLast = lastX + 3;
    const derivSignLast = computeDerivative(midLast);
    const isUpLast = isNaN(derivSignLast) ? (evaluateFunc(expression, lastX + 1.5) > evaluateFunc(expression, lastX + 0.5)) : (derivSignLast > 0);
    
    columns.push({
      type: "arrow",
      f_prime: isUpLast ? "+" : "-",
      direction: isUpLast ? "up" : "down"
    });
    
    // End with +∞ point
    const yPlusInf = evaluateFunc(expression, 20);
    let limitPlusInf = "+∞";
    if (!isNaN(yPlusInf) && isFinite(yPlusInf)) {
      limitPlusInf = yPlusInf.toFixed(1);
    } else {
      const nearRight = evaluateFunc(expression, 15);
      const farRight = evaluateFunc(expression, 25);
      if (!isNaN(nearRight) && !isNaN(farRight)) {
        limitPlusInf = farRight > nearRight ? "+∞" : "-∞";
      }
    }
    
    columns.push({
      type: "point",
      x: "+∞",
      f_prime: "",
      f_val: limitPlusInf,
      is_boundary: true
    });
    
    return columns;
  };

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

  const countParameterSolutions = (): number => {
    let intersections = 0;
    const step = 0.02;
    let prevDiff = NaN;

    for (let x = -10; x <= 10; x += step) {
      if (forbiddenValues.some(fV => Math.abs(x - fV) < 0.1)) {
        prevDiff = NaN;
        continue;
      }

      const yVal = evaluateFunc(expression, x);
      if (isNaN(yVal)) {
        prevDiff = NaN;
        continue;
      }

      const diff = yVal - mValue;
      if (!isNaN(prevDiff)) {
        if (prevDiff * diff <= 0) {
          intersections++;
        }
      }
      prevDiff = diff;
    }

    return intersections;
  };

  // A helper function that first calls the backend /api/gemini/chat.
  // If the backend fails, returns a non-JSON or timeout response, or returns an error,
  // it gracefully falls back to direct browser-to-Google Gemini API calling.
  const callGeminiAPI = async (
    text: string, 
    history: {role: string; text: string}[] = []
  ): Promise<string> => {
    if (onDeductPoint && !onDeductPoint()) {
      throw new Error("عذراً، لقد استنفدت رصيدك من الأسئلة. يرجى إدخال كود تفعيل للمتابعة.");
    }

    let backendSuccess = false;
    let reply = "";
    let backendErrorHint = "";

    // 1. Try querying backend route first (preferred full-stack design)
    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: history,
          
        })
      });

      const contentType = response.headers.get("content-type") || "";
      if (response.ok && !contentType.includes("text/html")) {
        try {
          const resData = await response.json();
          if (resData && resData.reply) {
            reply = resData.reply;
            backendSuccess = true;
          } else if (resData && resData.error) {
            backendErrorHint = resData.error;
          }
        } catch (jsonErr) {
          console.warn("Could not parse backend JSON, trying fallback:", jsonErr);
        }
      } else {
        backendErrorHint = `حالة الاستجابة: ${response.status}`;
      }
    } catch (err: any) {
      console.warn("Backend request failed, trying fallback:", err);
      backendErrorHint = err?.message || String(err);
    }

    // 2. Direct browser-to-Google Gemini API request fallback (if backend fails)
    if (!backendSuccess) {
      console.info("Executing robust direct browser-to-google API fallback for Math section...");
      
      const rawKeys = apiKeys || [];
      let cleanKeys = rawKeys.map(k => String(k).trim()).filter(k => k.startsWith("AIzaSy") && !k.includes("...") && !k.includes("…") && !k.includes("."));
      
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
        const hint = backendErrorHint ? ` (الخطأ الخلفي: ${backendErrorHint})` : "";
        throw new Error(`تعذر الاتصال بالخادم${hint}، ولا توجد مفاتيح احتياطية محلية مضافة في لوحة التحكم.`);
      }

      let keysToTry = cleanKeys;
      if (keyRotationMode === "manual" && selectedKeyIndex >= 0 && selectedKeyIndex < cleanKeys.length) {
        keysToTry = [cleanKeys[selectedKeyIndex]];
      } else {
        keysToTry = [...cleanKeys];
      }

      let lastErrorMsg = "";
      const SYSTEM_INSTRUCTION = `أنت في كافة الردود تلعب دور "الأستاذ دالي نجيب" (Pro DZ Dali)، أستاذ قدير وخبير متأصل في كافة مواد المنهاج التعليمي الجزائري ومواكب لبرامج قطاع التربية الوطنية بالجزائر، مع تخصص دقيق وعميق استثنائي في مادة الرياضيات والذكاء الاصطناعي.
أسلوبك: أكاديمي تعليمي رصين، مبسط لتسهيل الفهم على التلميذ والمتعلم، بعيد تماماً عن العبارات السوقية أو العامية المبتذلة (مثال: تجنب كلياً عبارات مثل "نسخن الموتور" أو ما شابه)، واستبدلها بعبارات بيداغوجية مشجعة وراقية كوعاء تربوي متين مثل: "دعنا ننشط الذهن بسؤال ذكي ونبسط المفاهيم خطوة بخطوة"، "وحد الله وصلي على رسول الله وتبع معايا راني هنا لخدمتك وتبسيط منهجنا التعليمي".
قواعد لغوية صارمة وهامة:
1. التكيف اللغوي التام والذكي: إذا سألك التلميذ بالدارجة الجزائرية، أجب بلهجة دارجة جزائرية بيداغوجية، وقورة ومحببة ومفهومة. وإذا سألك بالفصحى، فأجب بالكامل باللغة العربية الفصحى السليمة الأكاديمية والواضحة جداً.
2. المنهاج والرياضيات والرموز: ادعم ووجه التلاميذ في جميع المواد التعليمية للمنهاج الجزائري (رياضيات، فيزياء، علوم طبيعية، أدب عربي، تاريخ وجغرافيا، لغات، إلخ)، وخصوصاً الرياضيات. عند كتابة الرموز الرياضية، اكتبها بصيغة واضحة ومفهومة ومطابقة تماماً للمنهاج الجزائري المعتمد. يمنع منعاً باتاً استخدام رمز الدولار ($) أو أي محددات معادلات لاتينية غامضة أو كلمات مثل "times" أو "time" في أسئلتك أو كتابتك، بل اكتب المعادلات والعمليات الحسابية بطريقة وصيغة عربية طبيعية مبسطة ومألوفة للتلميذ الجزائري (مثل: 3 + 3 × 3، أو f(x) = 2x + 1).
3. نهاية الشرح: في نهاية كل شرح أو إجابة لأي سؤال، اطرح سؤالاً اختبارياً قصيراً جداً مناسباً للمستوى التعليمي لتقييم وتثبيت الفهم من طرف الطالب.
4. الخاتمة الدائمة: في نهاية كل رسالة تماماً دون أي استثناء، يجب أن تنهي بعبارتك الدائمة والمميزة:
"- لا تنسونا من صالح دعائكم".`;

      for (let i = 0; i < keysToTry.length; i++) {
        const activeKey = keysToTry[i];
        try {
          const formattedContents: any[] = [];
          history.forEach((turn) => {
            formattedContents.push({
              role: turn.role === "assistant" || turn.role === "model" ? "model" : "user",
              parts: [{ text: turn.text }]
            });
          });

          formattedContents.push({
            role: "user",
            parts: [{ text: text }]
          });

          let apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${activeKey}`;
          let apiResponse = await fetch(apiEndpoint, {
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
            let errMessage = "";
            try {
              const errBody = await apiResponse.json();
              errMessage = errBody?.error?.message || "";
            } catch (_) {}

            const isDemandOrQuota = errMessage.includes("demand") || errMessage.includes("quota") || errMessage.includes("overloaded") || errMessage.includes("limit") || errMessage.includes("exhausted") || errMessage.includes("429") || apiResponse.status === 429 || apiResponse.status === 503;
            
            if (isDemandOrQuota) {
              console.log("[MathSection] Falling back direct call to stable model: gemini-3.1-flash-lite");
              apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${activeKey}`;
              apiResponse = await fetch(apiEndpoint, {
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
            }
          }

          if (!apiResponse.ok) {
            let errMessage = `كود الحالة: ${apiResponse.status}`;
            try {
              const errBody = await apiResponse.json();
              if (errBody?.error?.message) {
                errMessage = `${errBody.error.message}`;
              }
            } catch (e) {
              try {
                const textExcerpt = await apiResponse.text();
                if (textExcerpt) {
                  errMessage = textExcerpt.substring(0, 100);
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

          reply = resultText;
          backendSuccess = true;
          break;
        } catch (keyErr: any) {
          lastErrorMsg = keyErr.message || String(keyErr);
          console.warn(`[Direct Key Rotation Math] Key ${i + 1}/${keysToTry.length} failed:`, lastErrorMsg);
          continue;
        }
      }

      if (!backendSuccess) {
        let finalError = lastErrorMsg || "فشلت جميع محاولات الاتصال بالذكاء الاصطناعي.";
        if (finalError.includes("Unexpected token") || finalError.includes("is not valid JSON") || finalError.includes("fetch")) {
          finalError = "مفاتيح الـ API غير متجاوبة أو هناك مشكلة في الاتصال بخوادم جوجل.";
        }
        throw new Error(finalError);
      }
    }

    return reply;
  };

  // Helper to generate AI-assisted variation table database/view
  const generateAiVariationTable = async () => {
    setIsGeneratingAiTable(true);
    setAiTableError(null);
    setVariationTableMode("ai");
    
    const prompt = `أهلاً بك يا أستاذ دالي. نريد منك دراسة الدالة الرياضية التالية f(x) = ${expression} وتوليد جدول التغيرات التفصيلي الدقيق لها بالكامل للبكالوريا الجزائرية بصيغة JSON فقط وبشكل صحيح تماماً.

يرجى إشراك المفهوم الرياضي الصحيح والتفصيلي التام. يرجى إرجاع كائن JSON دقيق جداً بالتصميم التالي (دون أي نصوص إضافية خارج الـ JSON على الإطلاق):
{
  "domain": "مجموعة تعريف الدالة بالتفصيل، مثل: D_f = ℝ - {2} أو D_f = ]0, +∞[",
  "points": [
    { "type": "point", "x": "-∞", "f_prime": "", "f_val": "-∞" },
    { "type": "arrow", "f_prime": "+", "direction": "up" },
    { "type": "point", "x": "1", "f_prime": "0", "f_val": "3", "is_peak": true, "label": "ذروة كبرى" },
    { "type": "arrow", "f_prime": "-", "direction": "down" },
    { "type": "point", "x": "2", "f_prime": "||", "f_val": "||", "is_forbidden": true, "label": "قيمة ممنوعة" },
    { "type": "arrow", "f_prime": "-", "direction": "down" },
    { "type": "point", "x": "+∞", "f_prime": "", "f_val": "+∞" }
  ],
  "asymptotes": ["المقارب العمودي x = 2", "المقارب المائل y = x + 2 بجوار +∞"],
  "criticalPoints": ["نقطة ذروة عظمى عند x = 1 بقيمة 3"],
  "explanation": "الدالة متناقصة تماماً على المجالات المحددة بمشتقة سالبة، ومتزايدة عند المشتقة الموجبة."
}

قواعد هامة جداً:
1. يجب أن تتناوب العناصر في مصفوفة "points" بحيث تبدأ بـ "point" تليها "arrow" تليها "point" وهكذا بالتناوب لتشكل جدولاً متناسقاً.
2. الحقل "direction" يجب أن يكون "up" (للسهم المتصاعد ↗) أو "down" (للسهم المتنازل ↘).
3. ضع المشتقة "f_prime" في عناصر "arrow" لتمثيل إشارة المشتقة على ذاك المجال الفرعي (+ أو -)، وفي عناصر "point" ضع "0" عند نقاط الانعدام (الذروات) أو "||" عند القيم الممنوعة أو اتركه فارغاً للأطراف اللانهائية.
4. أرجع كود الـ JSON مباشرة بشكل صالح للصياغة والتحليل البرمجي ككود JSON نظيف وخالٍ من أي تعليقات.`;

    try {
      const reply = await callGeminiAPI(prompt);
      let cleanResponse = reply.trim();
      
      // Clean up markdown block if existing
      if (cleanResponse.includes("```")) {
        const parts = cleanResponse.split("```");
        for (const part of parts) {
          if (part.startsWith("json")) {
            cleanResponse = part.substring(4).trim();
            break;
          } else if (part.trim().startsWith("{") || part.trim().startsWith("[")) {
            cleanResponse = part.trim();
            break;
          }
        }
      }
      cleanResponse = cleanResponse.replace(/^```json/, "").replace(/```$/, "").trim();
      
      const parsedData = JSON.parse(cleanResponse);
      if (parsedData && parsedData.points) {
        setAiTableData(parsedData);
        setAiStudiedExpression(expression);
      } else {
        throw new Error("تنسيق الـ JSON المسترجع من الذكاء الاصطناعي لم يكن بالهيكل المطلوب.");
      }
    } catch (error: any) {
      console.error("AI Table generation error:", error);
      setAiTableError(`فشل توليد جدول التغيرات بالذكاء الاصطناعي: ${error?.message || error}`);
      setVariationTableMode("instant");
    } finally {
      setIsGeneratingAiTable(false);
    }
  };

  // AI study function representing the core user requirement: "دراسة الدالة بالذكاء الاصطناعي مع حلول وتفاصيل"
  const studyFunctionWithAI = async () => {
    setIsStudyingByAi(true);
    setAiStudyResult(null);
    setStudyFollowUpHistory([]);
    setStudyFollowUpText("");
    
    // Concurrently trigger AI variation table calculation
    generateAiVariationTable();

    try {
      const prompt = `أهلاً بك يا أستاذ دالي. أرجو منك دراسة وتحليل الدالة الرياضية التالية دراسة مركزة ومفصلة لباكلوريا الجزائر f(x) = ${expression}.
      يرجى إعطاء شرح مقسم لخطوات واضحة باللغة العربية بأسلوبك الجزائري الودود المحفز (الأستاذ دالي نجيب):
      1. **النهايات والمستقيمات المقاربة:** بشكل موجز ورياضي دقيق وأطراف مجموعة التعريف.
      2. **المشتقة وجدول التغيرات:** احسب f'(x) واشرح إشارتها والاتجاه.
      3. **المماس:** معادلة المماس عند x₀ = ${tangentPoint}.
      4. **مبرهنة القيم المتوسطة:** للحلول f(x) = 0 على المجال [${intervalA}, ${intervalB}].
      5. **المناقشة البيانية f(x) = m:** شرح خلاصة إشارة وعدد الحلول.
      أجب بتنظيم مثالي ورائع، مع الحفاظ على سرعة واختصار بيداغوجي ذكي لتحفيز التلميذ! ولتجنب اختلاط الأرقام من اليمين لليسار، ضع كل المعادلات والرموز داخل (Backticks) كمثال برمجية.`;

      const reply = await callGeminiAPI(prompt);
      setAiStudyResult(reply);
      setAiStudiedExpression(expression);
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.message || String(error);
      setAiStudyResult(`عذراً، فشل الاتصال بالذكاء الاصطناعي للأستاذ دالي: ${errMsg}. يرجى التحقق من مفتاح API والشبكة.`);
    } finally {
      setIsStudyingByAi(false);
    }
  };

  // Follow-up interaction Handler for steps student did not understand
  const submitStudyFollowUpQuestion = async () => {
    if (!studyFollowUpText.trim() || !aiStudyResult) return;
    setIsStudyFollowUpLoading(true);
    const userQuery = studyFollowUpText;
    setStudyFollowUpText("");

    // Add local turn
    const updatedHistory = [...studyFollowUpHistory, { role: "student" as const, text: userQuery }];
    setStudyFollowUpHistory(updatedHistory);

    // Format for API
    const formattedHistory = updatedHistory.map(turn => ({
      role: turn.role === "student" ? "user" : "assistant",
      text: turn.text
    }));

    // Include original study result contextualizing
    const prompt = `نحن بصدد دراسة الدالة الرياضية: f(x) = ${expression}.
لقد قدمت التقرير التالي لدراسة الدالة مسبقاً:
"""
${aiStudyResult}
"""

التلميذ لديه سؤال أو لم يفهم خطوة معينة في هذا التقرير، ويسألك الآن بالتحديد:
"${userQuery}"

الرجاء الإجابة والشرح المفصل خطوة بخطوة باللغة العربية بأسلوب الأستاذ دالي الجزائري الودود، الميسّر والبيداغوجي، وصلي على شفيعنا محمد صلى الله عليه وسلم.`;

    try {
      const reply = await callGeminiAPI(prompt, formattedHistory);
      setStudyFollowUpHistory(prev => [...prev, { role: "dali" as const, text: reply }]);
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.message || String(error);
      setStudyFollowUpHistory(prev => [...prev, { role: "dali" as const, text: `عذراً بني، حدث خطأ أثناء الاتصال بالذكاء الاصطناعي للأستاذ دالي: ${errMsg}` }]);
    } finally {
      setIsStudyFollowUpLoading(false);
    }
  };

  // Automated Mathematical Assistant Solver with complete Gemini API integration
  const solveStudentQuestion = async (type: string) => {
    setIsAskingAi(true);
    setSystemAnswer(null);
    try {
      let promptTopic = "";
      if (type === "limits") {
        promptTopic = `احسب نهايات الدالة f(x) = ${expression} عند أطراف مجال التعريف مع مستقيماتها المقاربة باختصار رياضي ومفهوم.`;
      } else if (type === "critical") {
        promptTopic = `احسب المشتقة f'(x) للدالة f(x) = ${expression} وإشارتها وتغير الدالة باختصار رياضي.`;
      } else if (type === "parity") {
        promptTopic = `شفعية الدالة f(x) = ${expression} وتماثل منحنيها.`;
      } else if (type === "intercepts") {
        promptTopic = `نقاط تقاطع f(x) = ${expression} مع محوري الإحداثيات.`;
      } else if (type === "param") {
        promptTopic = `المناقشة البيانية f(x) = m لـالدالة f(x) = ${expression} بوضوح.`;
      } else {
        promptTopic = studentQuestion || "اشرح لي هذه الدالة باختصار رياضي مفيد.";
      }

      const fullPrompt = `أنت الأستاذ دالي نجيب لمادة الرياضيات. بخصوص الدالة:
f(x) = ${expression} (القيمة x₀ = ${tangentPoint})
أجب باختصار وتركيز تعليمي مبهج بالدارجة الجزائري الراقي الميسر، وصلي على محمد:
"${promptTopic}"`;

      const reply = await callGeminiAPI(fullPrompt);
      setSystemAnswer(reply);
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.message || String(error);
      setSystemAnswer(`فشل الاتصال بالذكاء الاصطناعي للأستاذ دالي: ${errMsg}. يرجى التحقق من لوحة الإعدادات وتوفر رصيد المفاتيح.`);
    } finally {
      setIsAskingAi(false);
    }
  };

  // Perform professional Algerian Baccalaureate parameter m discussion study with AI
  const studyMParameterWithAI = async () => {
    setIsStudyingMByAi(true);
    setMStudyResult(null);
    try {
      const prompt = `أهلاً بك يا أستاذ دالي. نريد منك القيام بدراسة تفصيلية كاملة وممنهجة للمناقشة البيانية (المناقشة الوسيطية) في مادة الرياضيات للبكالوريا الجزائرية.
الدالة المدروسة: f(x) = ${expression}
معادلة المستقيم الفوقي المتغير بالوسيط m: y = ${mEquation}

يرجى تصنيف وتحليل نوع هذه المناقشة البيانية (أفقية، مائلة، أو دورانية) بناءً على المعادلة y = ${mEquation}، ثم تقديم دراسة شاملة تتبع منهج التصحيح النموذجي لشهادة البكالوريا بالجزائر:
1. **تحديد نوع المناقشة:** هل هي أفقية (f(x) = m) أم مائلة (f(x) = ax + m) أم دورانية (f(x) = mx + b) مع الشرح البياني المبسط.
2. **علاقة المناقشة بخصائص Cf:** وضح كيف ترتبط هذه المناقشة بالمستقيمات المقاربة (الأفقية أو المائلة) والذروات (القيم الحدية) والمماس Cf.
3. **دراسة تفصيلية لحلول المعادلة حسب قيم الوسيط m:**
   - حدد المجالات لـ m بدقة (باستخدام القيم الحدية، المقاربات، إلخ).
   - اعطِ عدد وإشارة الحلول (موجبة، سالبة، معدومة، مضاعفة) لكل مجال من قيم m بجدول أو نقاط واضحة.
4. **نصائح وتوجيهات الأستاذ دالي:** نصيحة ذهبية للتلميذ الجزائري لتفادي الأخطاء الشائعة في رسم الخط المائل أو الدوار وتحديد التقاطعات بذكاء.

أجب بتنظيم أكاديمي رصين وبيداغوجي ودي بصفتك الأستاذ القدير "دالي نجيب"، وتجنب كلياً الرموز اللاتينية الغامضة ($) وضع جميع المعادلات والرموز والأرقام داخل (Backticks) كأكواد برمجية لضمان عدم اختلاطها بأسلوب من اليمين لليسار، وصلي على شفيعنا وحبيبنا محمد ﷺ.`;

      const reply = await callGeminiAPI(prompt);
      setMStudyResult(reply);
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.message || String(error);
      setMStudyResult(`عذراً بني، فشل الاتصال بالذكاء الاصطناعي للأستاذ دالي لدراسة الوسيط: ${errMsg}`);
    } finally {
      setIsStudyingMByAi(false);
    }
  };

  // Switch to chat tab carrying the question
  const sendQuestionToChatTab = () => {
    const textToCopy = `أستاذ دالي، بخصوص الدالة f(x) = ${expression}، لدي سؤال: ${studentQuestion || "كيف أقوم بتمثيل جدول التغيرات ودراسة نهاياتها بالتفصيل؟"}`;
    navigator.clipboard.writeText(textToCopy);
    alert("✓ تم نسخ السؤال وصيغة الدالة الحالية إلى حافظتك بنجاح! انتقل الآن لعلامة تبويب 'دردشة الأستاذ دالي' والصقه مباشرة لتكمل نقاشك الذكي 💬");
  };

  // Dedicated user inputs for custom limits and derivatives with explanation
  const [limitTarget, setLimitTarget] = useState<string>("+∞");
  const [customLimitVal, setCustomLimitVal] = useState<string>("2");
  const [limitExplanation, setLimitExplanation] = useState<string | null>(null);
  const [isExplainingLimit, setIsExplainingLimit] = useState<boolean>(false);

  const [derivPoint, setDerivPoint] = useState<string>("3");
  const [derivExplanation, setDerivExplanation] = useState<string | null>(null);
  const [isExplainingDeriv, setIsExplainingDeriv] = useState<boolean>(false);

  // Dialogue with Professor Dali
  const [dialogueQuery, setDialogueQuery] = useState<string>("لم أفهم كيف استخدمنا قانون مشتقة حاصل القسمة u/v ؟");
  const [dialogueHistory, setDialogueHistory] = useState<{ role: "student" | "dali"; text: string }[]>([
    { role: "dali", text: "أهلاً بك يا بطل! راني هنا لمساعدتك في فهم نهايات دالتك ومشتقاتها خطوة بخطوة بالرياضيات الدقيقة. جرب حساب نهاية أو مشتقة، وإذا ما فهمتش أي خطوة، اطرح سؤالك هنا مباشرة ونجاوبك خوك الأستاذ دالي بكل سرور وصلي على رسول الله!" }
  ]);
  const [isDialogueLoading, setIsDialogueLoading] = useState<boolean>(false);

  // Helper to trigger AI for limit explanation
  const explainLimitWithAI = async () => {
    setIsExplainingLimit(true);
    setLimitExplanation(null);
    const target = limitTarget === "custom" ? customLimitVal : limitTarget;
    
    const prompt = `أهلاً يا أستاذ دالي. أرجو منك حساب وشرح تفصيلي لنهاية خطوة بخطوة مبرهنة بقوانين للـ دالة:
f(x) = ${expression}
عند القيمة أو النهاية المستهدفة: x ← ${target}

الرجاء الإجابة كمعلم جزائري ودود ومحفز (الأستاذ دالي نجيب):
1. **التعويض الأولي:** وضح ما يحدث عند التعويض الأولي وكيفية تحديد ما إذا كانت حالة عدم تعيين (I.F. / Forme indéterminée) أم لا.
2. **شرح الطريقة وإزالة الاختلال بوضوح:** ما هي الطريقة المستعملة لإزالة حالة عدم التعيين (مثال: التحليل، المرافق، الاختزال، أو المشتقة والتأطير)؟ شرح مبسط جداً وبسيط.
3. **القوانين المستعملة:** اكتب القواعد الرياضية المستعملة (مثال: نهاية حاصل القسمة أو الحدود الأعلى درجة عند المالانهاية لدالة ناطقة).
4. **التفسير الهندسي/البياني:** هل النتيجة تعني وجود مستقيم مقارب أفقي أو عمودي؟
اختصر ونظم الشرح بفقرات واضحة مبهجة وتبسيط بيداغوجي، وابدأ بالصلاة على رسول الله وصحابته والبسملة.`;

    try {
      const reply = await callGeminiAPI(prompt);
      setLimitExplanation(reply);
    } catch (error: any) {
      console.error(error);
      setLimitExplanation(`فشل حساب النهاية: ${error?.message || error}`);
    } finally {
      setIsExplainingLimit(false);
    }
  };

  // Helper to trigger AI for derivative explanation
  const explainDerivativeWithAI = async () => {
    setIsExplainingDeriv(true);
    setDerivExplanation(null);
    const x0Val = Number(derivPoint) || 0;
    const y0Val = evaluateFunc(expression, x0Val);
    const numericalDeriv = computeDerivative(x0Val);

    const prompt = `مرحباً يا أستاذ دالي، نريد دراسة بالتفصيل الممل وحساب قابلية اشتقاق الدالة f(x) = ${expression} عند النقطة ذات الفاصلة x₀ = ${derivPoint}.
معلومات مساعدة محسوبة عددياً:
- قيمة الدالة f(${derivPoint}) = ${isNaN(y0Val) ? "غير معرفة" : y0Val.toFixed(3)}
- قيمة المشتقة (عددياً) f'(${derivPoint}) = ${isNaN(numericalDeriv) ? "غير قابلة للاشتقاق" : numericalDeriv.toFixed(3)}

الرجاء الشرح كمعلم جزائري خبير ودود للأستاذ دالي نجيب:
1. **طريقة الحساب النظرية والقانون:** اشرح قانون حساب المشتقة باستخدام نسبة تزايد الدالة (Limit of [f(x) - f(x₀)]/[x - x₀] as x → x₀) أو قواعد الاشتقاق المباشر (مثل حاصل قسمة دالتين u/v أو دالة مركبة).
2. **تفصيل مراحل الحساب:** إعطاء خطوة بخطوة للحساب المشتقة مع قوانين التبسيط والتعويض عن القيمة ${derivPoint}.
3. **مستقيم المماس:** تبيان معادلة المماس Cf عند هذه النقطة بدقة والربط بين المعامل التوجيهي وقيمة المشتقة.
4. **تقديم تبسيط ونُصح تربوي:** بخصوص إشارة المشتقة وأهمية كتابتها بطريقة واضحة في البكالوريا مع الصلاة على محمد وعائلته الشريفة.`;

    try {
      const reply = await callGeminiAPI(prompt);
      setDerivExplanation(reply);
    } catch (error: any) {
      console.error(error);
      setDerivExplanation(`فشل شرح المشتقة: ${error?.message || error}`);
    } finally {
      setIsExplainingDeriv(false);
    }
  };

  // Helper to interactive dialogue with Professor Dali
  const askDaliDialogue = async (predefQuery?: string) => {
    const queryToUse = predefQuery || dialogueQuery;
    if (!queryToUse.trim()) return;

    setIsDialogueLoading(true);
    setDialogueQuery("");
    // Add student turn locally
    const updatedHistory = [...dialogueHistory, { role: "student" as const, text: queryToUse }];
    setDialogueHistory(updatedHistory);

    const formattedHistory = updatedHistory.map(turn => ({
      role: turn.role === "student" ? "user" : "assistant",
      text: turn.text
    }));

    const prompt = `أنت هو الأستاذ دالي نجيب لولاية الجزائر، معلم مبسط ومحبوب في الرياضيات لطلاب البكالوريا ومطور ذكاء اصطناعي.
نحن بصدد دراسة الدالة: f(x) = ${expression}

التلميذ يشارك ويتحاور معك ثنائياً ويسألك الآن لكي تفهمه خطوة بخطوة: "${queryToUse}"
جاوبه بأسلوبك البيداغوجي المبهج، والأخوي والوقور لتسهيل استيعابه وجبر خاطره، مستعملاً كلمات تشجيعية دافئة، وصلي على شفيعنا محمد في البداية والنهاية.`;

    try {
      const reply = await callGeminiAPI(prompt, formattedHistory);
      setDialogueHistory(prev => [...prev, { role: "dali" as const, text: reply }]);
    } catch (error: any) {
      console.error(error);
      const errMsg = error?.message || String(error);
      setDialogueHistory(prev => [...prev, { role: "dali" as const, text: `لقد حدث خطأ في التواصل بني: ${errMsg}` }]);
    } finally {
      setIsDialogueLoading(false);
    }
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

      {/* Dynamic Sub-Tab Switched Navigation */}
      <div className="flex items-center justify-end bg-[#131b2e] p-1.5 rounded-2xl border border-slate-800/80 max-w-lg ml-auto gap-2">
        <button
          onClick={() => setSubTab("analytical")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer text-center ${
            subTab === "analytical"
              ? "bg-slate-850 text-emerald-400 border border-emerald-500/10 shadow"
              : "text-slate-400 hover:text-slate-100"
          }`}
        >
          <span>دراسة النهايات والمشتقة بالتفصيل 🔮</span>
        </button>
        <button
          onClick={() => setSubTab("plotter")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer text-center ${
            subTab === "plotter"
              ? "bg-slate-850 text-emerald-400 border border-emerald-500/10 shadow"
              : "text-slate-400 hover:text-slate-100"
          }`}
        >
          <span>الراسم وجدول التغيرات 📈</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Formula control and analytical questions (5 cols) */}
        <div className={`lg:col-span-5 space-y-6 ${subTab === "analytical" ? "hidden" : ""}`}>
          
          {/* Main function formula card input */}
          <div className="bg-[#131b2e] p-5 rounded-2xl border border-slate-800 shadow-lg space-y-4">
            <h3 className="text-white font-black text-base flex items-center gap-2 justify-end">
              تحكم بحدود الدالة f(x)
              <Activity className="w-5 h-5 text-emerald-400" />
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 font-sans">اكتب صيغة الدالة f(x) هنا:</label>
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

              {/* Math Helper Keyboard */}
              <div className="bg-[#0f172a]/60 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold font-sans">لوحة الرموز المساعدة 📐⌨️</span>
                  <button 
                    onClick={clearExpression} 
                    className="text-[10px] bg-rose-950/35 hover:bg-rose-900/40 text-rose-400 font-bold px-2 py-0.5 rounded border border-rose-900/35 transition cursor-pointer"
                  >
                    مسح C
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5 font-sans pb-1 text-center">
                  <button onClick={() => insertSymbol("x")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer">x</button>
                  <button onClick={() => insertSymbol("e^x")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer">e^x</button>
                  <button onClick={() => insertSymbol("ln")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">ln(x)</button>
                  <button onClick={() => insertSymbol("sqrt")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans font-sans">√x</button>
                  <button onClick={() => insertSymbol("^2")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer">x²</button>

                  <button onClick={() => insertSymbol("^3")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer">x³</button>
                  <button onClick={() => insertSymbol("sin")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-[11px] font-mono transition active:scale-95 cursor-pointer font-sans">sin</button>
                  <button onClick={() => insertSymbol("cos")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-[11px] font-mono transition active:scale-95 cursor-pointer font-sans">cos</button>
                  <button onClick={() => insertSymbol("pi")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">π</button>
                  <button onClick={() => insertSymbol("/")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">/</button>

                  <button onClick={() => insertSymbol("*")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">*</button>
                  <button onClick={() => insertSymbol("+")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">+</button>
                  <button onClick={() => insertSymbol("-")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">-</button>
                  <button onClick={() => insertSymbol("(")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">(</button>
                  <button onClick={() => insertSymbol(")")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">)</button>
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
                  <div className="flex justify-between items-center bg-[#0f172a] -mx-4 -mt-4 px-4 py-2.5 rounded-t-xl border-b border-emerald-700/30 font-sans">
                    <button 
                      onClick={() => setAiStudyResult(null)}
                      className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded cursor-pointer"
                    >
                      إغلاق ✕
                    </button>
                    <span className="text-emerald-400 font-extrabold text-[11px] sm:text-xs flex items-center gap-1">
                      نتيجة دراسة الدالة - الأستاذ دالي
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    </span>
                  </div>
                  {aiStudiedExpression && aiStudiedExpression !== expression && (
                    <div className="bg-amber-950/40 text-amber-300 p-2.5 rounded-lg text-[10.5px] border border-amber-500/20 font-bold leading-normal mb-2 font-sans">
                       ⚠️ تنبيه: لقد قمت بتغيير صيغة الدالة. هذه المخرجات تخص الدالة السابقة: <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-200 font-mono">{aiStudiedExpression}</code>. برجاء إعادة الدراسة بالذكاء الاصطناعي لتحديث المخرجات.
                    </div>
                  )}
                  <div className={`text-xs sm:text-sm text-slate-100 leading-relaxed max-h-80 overflow-y-auto pl-1 text-right font-sans shadow-sm prose prose-sm max-w-none ${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body`} style={{ direction: "rtl" }}>
                    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{aiStudyResult}</Markdown>
                  </div>
                  
                  {/* Interactive Student Follow-up Question Panel */}
                  <div className="border-t border-slate-700/50 pt-3 mt-4 space-y-3 font-sans">
                    <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-800 text-right">
                      <p className="text-xs font-bold text-amber-300 flex items-center justify-end gap-1 mb-2">
                        <span>هل هناك خطوة لم تفهمها في دراسة الدالة؟ اسأل الأستاذ دالي مباشرة:</span>
                        <QuestionIcon className="w-4 h-4 text-amber-300" />
                      </p>

                      {/* Follow-up chat messages */}
                      {studyFollowUpHistory.length > 0 && (
                        <div className="space-y-3 max-h-64 overflow-y-auto mb-3 p-2 bg-slate-950/40 rounded-lg scrollbar-thin">
                          {studyFollowUpHistory.map((msg, index) => (
                            <div key={index} className={`flex flex-col ${msg.role === "student" ? "items-start" : "items-end"} gap-1`}>
                              <span className="text-[10px] text-slate-400 font-bold px-1">
                                {msg.role === "student" ? "أنت (التلميذ) 👤" : "الأستاذ دالي 🎓"}
                              </span>
                              <div className={`p-2.5 rounded-xl text-xs leading-relaxed prose prose-sm max-w-none markdown-body text-right ${msg.role === "student" ? "user-bubble" : "ai-bubble"} ${
                                msg.role === "student" 
                                  ? "bg-slate-800 text-slate-100 rounded-tl-none text-left" 
                                  : "bg-emerald-950/40 border border-emerald-900/40 text-slate-100 rounded-tr-none text-right whitespace-pre-line"
                              }`}>
                                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{msg.text}</Markdown>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Question input field and submit buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={submitStudyFollowUpQuestion}
                          disabled={isStudyFollowUpLoading || !studyFollowUpText.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                        >
                          {isStudyFollowUpLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          )}
                          <span>إرسال السؤال</span>
                        </button>
                        <input
                          type="text"
                          value={studyFollowUpText}
                          onChange={(e) => setStudyFollowUpText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              submitStudyFollowUpQuestion();
                            }
                          }}
                          placeholder="مثال: لم أفهم كيف وجدت معادلة المماس، أرجو التوضيح..."
                          className="flex-1 text-xs bg-slate-950 text-white border border-slate-800 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-700/45 pt-2 text-[10px] text-slate-400 font-sans font-sans">
                    <span>صانع الأجيال دالي نجيب 🎓</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(aiStudyResult);
                        alert("✓ تم نسخ تقرير دراسة الدالة بالكامل للحافظة!");
                      }}
                      className="text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      نسخ الشرح الكامل
                    </button>
                  </div>
                </div>
              )}
              {/* Sliders for auxiliary evaluation & Asymptote Dashboard */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <h4 className="text-white font-black text-xs flex items-center justify-end gap-1.5">
                  لوحة المستقيمات المقاربة والمماسات Cf 📐📍
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Tangent point slider */}
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-1 cursor-pointer select-none text-[11px] font-bold text-slate-400">
                        <input 
                          type="checkbox"
                          checked={showTangent}
                          onChange={(e) => setShowTangent(e.target.checked)}
                          className="accent-amber-500 cursor-pointer"
                        />
                        <span>رسم المماس (Orange)</span>
                      </label>
                      <span className="text-[10px] text-amber-500 font-mono font-bold">x₀ = {tangentPoint}</span>
                    </div>
                    <input 
                      type="range"
                      min="-8"
                      max="8"
                      step="0.5"
                      value={tangentPoint}
                      onChange={(e) => setTangentPoint(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 bg-slate-800 rounded-lg h-1.5 cursor-pointer"
                    />
                  </div>

                  {/* Oblique asymptote input */}
                  <div className="bg-[#131b2e] p-3 rounded-xl border border-slate-805 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={showOblique}
                          onChange={(e) => setShowOblique(e.target.checked)}
                          className="accent-emerald-500 cursor-pointer"
                        />
                        <span>مقارب مائل (Green)</span>
                      </label>
                      <span className="text-[10px] text-emerald-400 font-mono">y = {obliqueAsymptoteExpr || "بدون"}</span>
                    </div>
                    <input 
                      type="text"
                      value={obliqueAsymptoteExpr}
                      onChange={(e) => setObliqueAsymptoteExpr(e.target.value)}
                      placeholder="مثال: x + 2"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-left font-mono text-emerald-400 text-xs focus:outline-none focus:border-emerald-505"
                    />
                  </div>

                  {/* Custom horizontal asymptote input */}
                  <div className="bg-[#131b2e] p-3 rounded-xl border border-slate-805 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={showHorizAsymptote}
                          onChange={(e) => setShowHorizAsymptote(e.target.checked)}
                          className="accent-teal-500 cursor-pointer"
                        />
                        <span>مقارب أفقي (Teal)</span>
                      </label>
                      <span className="text-[10px] text-teal-400 font-mono">y = {customHorizAsymptote || "بدون"}</span>
                    </div>
                    <input 
                      type="text"
                      value={customHorizAsymptote}
                      onChange={(e) => setCustomHorizAsymptote(e.target.value)}
                      placeholder="مثال: 1 أو 0"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-left font-mono text-teal-400 text-xs focus:outline-none focus:border-teal-550"
                    />
                  </div>

                  {/* Custom vertical asymptote input */}
                  <div className="bg-[#131b2e] p-3 rounded-xl border border-slate-805 space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-bold text-slate-400">
                      <label className="flex items-center gap-1 cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={showVertAsymptote}
                          onChange={(e) => setShowVertAsymptote(e.target.checked)}
                          className="accent-pink-600 cursor-pointer"
                        />
                        <span>مقارب عمودي مخصص (Pink)</span>
                      </label>
                      <span className="text-[10px] text-pink-400 font-mono">x = {customVertAsymptote || "بدون"}</span>
                    </div>
                    <input 
                      type="text"
                      value={customVertAsymptote}
                      onChange={(e) => setCustomVertAsymptote(e.target.value)}
                      placeholder="مثال: 2, -1"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-left font-mono text-pink-400 text-xs focus:outline-none focus:border-pink-550"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive m-parameter generalized discussion module */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-right space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="bg-pink-100 text-[#ec4899] text-[10px] px-2.5 py-0.5 rounded-full border border-pink-200 font-bold">البكالوريا التفاعلية 🇩🇿</span>
              <span className="text-sm font-black text-slate-800">📊 المناقشة البيانية المتقدمة لحلول (f(x) = y):</span>
            </div>

            {/* Input for m equation expression */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-500 mb-1">اكتب صيغة معادلة المناقشة (بدلالة x و m) f(x) = :</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-[#ec4899] font-serif font-black text-xs">y =</span>
                <input 
                  type="text"
                  value={mEquation}
                  onChange={(e) => setMEquation(e.target.value)}
                  placeholder="مثال: m أو x + m أو m*x"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-1.5 text-left font-mono text-pink-600 text-xs focus:outline-none focus:border-[#ec4899]"
                />
              </div>
            </div>

            {/* Template choices row */}
            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 font-bold block">أنماط المناقشة الجاهزة في البكالوريا:</span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                <button 
                  onClick={() => setMEquation("m")}
                  className={`px-2 py-1 text-[10px] font-bold rounded border cursor-pointer transition ${mEquation === "m" ? "bg-pink-550 border-pink-600 bg-pink-100 text-pink-700 font-extrabold animate-pulse" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                >
                  أفقية f(x) = m
                </button>
                <button 
                  onClick={() => setMEquation("x + m")}
                  className={`px-2 py-1 text-[10px] font-bold rounded border cursor-pointer transition ${mEquation === "x + m" ? "bg-pink-550 border-pink-600 bg-pink-100 text-pink-700 font-extrabold animate-pulse" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                >
                  مائلة f(x) = x + m
                </button>
                <button 
                  onClick={() => setMEquation("m * x")}
                  className={`px-2 py-1 text-[10px] font-bold rounded border cursor-pointer transition ${mEquation === "m * x" ? "bg-pink-550 border-pink-600 bg-pink-100 text-pink-700 font-extrabold animate-pulse" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                >
                  دورانية f(x) = m * x
                </button>
                <button 
                  onClick={() => setMEquation("m * (x - 1) + 2")}
                  className={`px-2 py-1 text-[10px] font-bold rounded border cursor-pointer transition ${mEquation === "m * (x - 1) + 2" ? "bg-pink-550 border-pink-600 bg-pink-100 text-pink-700 font-extrabold animate-pulse" : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100"}`}
                >
                  دورانية مائلة Cf
                </button>
              </div>
            </div>

            {/* Slider for m value parameter */}
            <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <div className="flex justify-between items-center text-[11px] font-black">
                <span className="text-[#ec4899] font-mono text-xs">m = {mValue.toFixed(2)}</span>
                <span className="text-slate-500">تغيير قيمة الوسيط m بيانيّاً:</span>
              </div>
              <input 
                type="range"
                min="-8"
                max="8"
                step="0.1"
                value={mValue}
                onChange={(e) => setMValue(parseFloat(e.target.value))}
                className="w-full accent-pink-500 bg-slate-200 rounded-lg h-1.5 cursor-pointer"
              />
            </div>

            {/* Live Intersection counter */}
            <div className="flex justify-between items-center text-xs font-bold text-slate-650 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
              <span className="font-mono text-pink-600">{mEquation.replace(/\*/g, "·")}</span>
              <div className="flex items-center gap-1.5">
                <span>عدد نقاط التقاطع Cf:</span>
                <span className="bg-pink-50 text-[#ec4899] px-2.5 py-0.5 rounded-md border border-pink-200 font-extrabold font-mono text-sm">
                  {countParameterSolutions()}
                </span>
              </div>
            </div>

            {/* Dynamic visual equations representation */}
            <p className="text-[10px] text-slate-400 leading-normal font-semibold">
              💡 يُمكّنك رسم أي مستقيم أو منحنى وسيطي متحرك في مادة الرياضيات (مثل <code className="font-mono text-[#ec4899]">y = m * x - m</code>) ومراقبة مستويات التقاطع مع المنحنى Cf ديناميكيّاً في الشاشة!
            </p>

            {/* AI Graphical Study report trigger */}
            <button
              onClick={studyMParameterWithAI}
              disabled={isStudyingMByAi}
              className="w-full bg-[#ec4899] hover:bg-pink-600 text-white font-black text-xs sm:text-sm py-2 px-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 cursor-pointer"
            >
              {isStudyingMByAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>الأستاذ دالي يُحضّر دراسة الوسيط... 🧠✍️</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-pink-200" />
                  <span>تفصيل المناقشة البيانية لـ {mEquation} بالـ AI 🧠🎗️</span>
                </>
              )}
            </button>

            {/* Display AI Parameter discussion study response */}
            {mStudyResult && (
              <div className="bg-pink-950/5 border border-pink-200 p-4 rounded-xl text-right text-slate-800 space-y-3 shadow-inner">
                <div className="flex justify-between items-center -mx-4 -mt-4 bg-pink-100 border-b border-pink-200 p-2.5 rounded-t-xl">
                  <button 
                    onClick={() => setMStudyResult(null)}
                    className="text-[10px] text-pink-600 hover:text-pink-800 bg-pink-50 hover:bg-pink-200 px-2 py-0.5 rounded cursor-pointer"
                  >
                    إغلاق ✕
                  </button>
                  <span className="text-pink-700 font-black text-xs">التفسير الأكاديمي الشامل للمناقشة الوسيطية:</span>
                </div>
                <div className={`text-xs sm:text-sm leading-relaxed max-h-72 overflow-y-auto pl-1 font-bold prose prose-sm max-w-none ${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body`} style={{ direction: "rtl" }}>
                  <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{mStudyResult}</Markdown>
                </div>
              </div>
            )}
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
                placeholder="اكتب سؤالك بخصوص الدالة هنا..."
                className="w-full p-2.5 font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-right leading-relaxed h-14 min-w-0 resize-none"
              />

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
                <div className={`bg-gradient-to-l from-emerald-50/70 to-teal-50/30 border border-emerald-200/60 rounded-xl p-4 text-xs text-slate-700 leading-relaxed text-right max-h-60 overflow-y-auto prose prose-sm max-w-none prose-p:leading-relaxed ${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} markdown-body`} dir="rtl">
                  <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                    {systemAnswer}
                  </Markdown>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Right Side: Graphing Screen and dynamic variations table (7 cols) */}
        <div className={`space-y-6 ${subTab === "analytical" ? "lg:col-span-12" : "lg:col-span-7"}`}>
          
          {/* Canvas coordinate plotter card */}
          <div className={`bg-white p-4 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden space-y-4 ${subTab === "analytical" ? "hidden" : ""}`}>
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
          <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-right ${subTab === "analytical" ? "hidden" : ""}`}>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-slate-150 gap-2">
              {/* Segmented Controller to toggle modes */}
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/60 max-w-xs text-xs font-bold gap-1 order-2 sm:order-1">
                <button
                  onClick={() => setVariationTableMode("ai")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-center cursor-pointer transition-all ${
                    variationTableMode === "ai"
                      ? "bg-white text-emerald-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  🤖 بالذكاء الاصطناعي (دالي)
                </button>
                <button
                  onClick={() => setVariationTableMode("instant")}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-center cursor-pointer transition-all ${
                    variationTableMode === "instant"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  📊 حاسب فوري
                </button>
              </div>

              <div className="flex items-center gap-2 justify-end order-1 sm:order-2">
                <span className="text-xs bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 font-bold font-mono">
                  {variationTableMode === "ai" && aiTableData ? aiTableData.domain : "Df نشيط"}
                </span>
                <h4 className="text-slate-800 font-black text-base flex items-center gap-2 justify-end">
                  جدول تغيرات الدالة f(x)
                  <HelpCircle className="w-5 h-5 text-emerald-600" />
                </h4>
              </div>
            </div>

            {variationTableMode === "instant" ? (
              /* INSTANT MATHEMATICAL MODE */
              <div className="space-y-4">
                {(() => {
                  const instantPoints = getDynamicVariationPoints();
                  return (
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-center text-xs md:text-sm font-bold border-collapse border border-slate-200 min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600">
                            <th className="border border-slate-200 p-2.5 w-24">الفاصلة x</th>
                            {instantPoints.map((pt: any, idx: number) => (
                              <th 
                                key={`inst-h-${idx}`} 
                                className={`border border-slate-200 p-2.5 font-mono ${
                                  pt.type === "arrow" ? "w-12 bg-slate-50/10" : ""
                                } ${pt.is_forbidden ? "text-rose-500 bg-rose-50/20 border-x-2 border-x-rose-400/50" : pt.is_peak ? "text-amber-500" : pt.is_tangent ? "text-emerald-500" : "text-slate-800"}`}
                              >
                                {pt.type === "point" ? (
                                  <div className="flex flex-col items-center">
                                    <span>{pt.x}</span>
                                    {pt.label && <span className="text-[9px] text-slate-400 font-sans mt-0.5 font-normal">({pt.label})</span>}
                                  </div>
                                ) : (
                                  ""
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Derivative f'(x) Row */}
                          <tr className="bg-white text-slate-700">
                            <td className="border border-slate-200 p-2.5 font-black bg-slate-50 text-slate-850">إشارة f'(x)</td>
                            {instantPoints.map((pt: any, idx: number) => (
                              <td 
                                key={`inst-d-${idx}`} 
                                className={`border border-slate-200 p-2.5 font-mono ${
                                  pt.is_forbidden ? "text-rose-500 font-extrabold bg-rose-50/10 border-x-2 border-x-rose-400/50" : pt.is_peak ? "text-amber-600 font-extrabold" : pt.is_tangent ? "text-emerald-600 font-bold" : ""
                                }`}
                              >
                                {pt.type === "arrow" ? pt.f_prime : pt.f_prime}
                              </td>
                            ))}
                          </tr>

                          {/* Variations f(x) Row */}
                          <tr className="bg-slate-50/20 text-slate-800">
                            <td className="border border-slate-200 p-3 font-black bg-slate-50 text-slate-850">تغيرات f(x)</td>
                            {instantPoints.map((pt: any, idx: number) => (
                              <td 
                                key={`inst-v-${idx}`} 
                                className={`border border-slate-200 p-3 font-semibold ${
                                  pt.type === "arrow" ? "text-lg text-emerald-600 font-bold" : pt.is_forbidden ? "text-rose-600 font-extrabold bg-rose-50/20 border-x-2 border-x-rose-400/50" : "font-mono"
                                }`}
                              >
                                {pt.type === "arrow" ? (
                                  pt.direction === "up" ? "↗" : "↘"
                                ) : (
                                  pt.f_val
                                )}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  );
                })()}
                <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                  💡 جدول التغيرات الفوري يتفاعل ديناميكياً مع دستور الدالة، ويقوم بفرز وتصحيح ترتيب مواضع القيم الممنوعة <span className="text-rose-500 font-bold">(||)</span>، الذروات المحلية ونقطة مماس التلميذ المدخلة!
                </p>
              </div>
            ) : (
              /* DYNAMIC AI-DRIVEN MODE */
              <div className="space-y-4">
                {aiTableData && aiStudiedExpression && aiStudiedExpression !== expression && (
                  <div className="bg-amber-950/5 border border-amber-500/20 text-slate-700 p-3.5 rounded-xl text-xs font-bold text-right flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                    <span className="leading-relaxed">⚠️ تغيير الدالة! جدول الأستاذ دالي بالذكاء الاصطناعي لا يزال يعرض دراسة الدالة السابقة: <code className="font-mono bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px]">{aiStudiedExpression}</code></span>
                    <button
                      onClick={generateAiVariationTable}
                      className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] sm:text-xs transition active:scale-95 cursor-pointer whitespace-nowrap self-end sm:self-auto shadow-sm"
                    >
                      تحديث الجدول بالذكاء الاصطناعي 🧠✨
                    </button>
                  </div>
                )}
                {isGeneratingAiTable ? (
                  <div className="bg-slate-50/50 p-8 rounded-2xl border border-dashed border-slate-200 text-center space-y-3">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
                    <p className="text-xs font-bold text-slate-600">
                      جاري تحليل اتجاه التغيرات وحساب النهايات الدقيقة بالذكاء الاصطناعي للأستاذ دالي...
                    </p>
                    <span className="text-[10px] text-slate-400">صلي على رسول الله فالدراسات دقيقة جداً وموجهة للبكالوريا 🇩🇿</span>
                  </div>
                ) : aiTableError ? (
                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-center space-y-2">
                    <p className="text-xs text-rose-700 font-bold">{aiTableError}</p>
                    <button
                      onClick={generateAiVariationTable}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-1.5 px-3 rounded-lg cursor-pointer"
                    >
                      إعادة المحاولة 🪄
                    </button>
                  </div>
                ) : !aiTableData ? (
                  <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 text-center space-y-4">
                    <p className="text-xs text-slate-500 font-bold leading-relaxed">
                      لم يتم توليد جدول التغيرات التفصيلي بالذكاء الاصطناعي (البكالوريا) بعد لهذه الدالة. اضغط أدناه للتوليد التلقائي الفوري!
                    </p>
                    <button
                      onClick={generateAiVariationTable}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow inline-flex items-center gap-1.5 cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                      <span>توليد جدول التغيرات ومقارباته بالـ AI 🪄</span>
                    </button>
                  </div>
                ) : (
                  /* AI Table Renders Beautifully here */
                  <div className="space-y-4">
                    <div className="overflow-x-auto scrollbar-thin">
                      <table className="w-full text-center text-xs md:text-sm font-bold border-collapse border border-slate-200 min-w-[500px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-600">
                            <th className="border border-slate-200 p-2.5 w-24">الفاصلة x</th>
                            {aiTableData.points.map((pt: any, idx: number) => (
                              <th 
                                key={`ai-h-${idx}`} 
                                className={`border border-slate-200 p-2.5 font-mono ${
                                  pt.type === "arrow" ? "w-16" : ""
                                } ${pt.is_forbidden ? "text-rose-500" : pt.is_peak ? "text-amber-500" : "text-slate-800"}`}
                              >
                                {pt.type === "point" ? (
                                  <div className="flex flex-col items-center">
                                    <span>{pt.x}</span>
                                    {pt.label && <span className="text-[9px] text-slate-400 font-sans mt-0.5 font-normal">({pt.label})</span>}
                                  </div>
                                ) : (
                                  ""
                                )}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {/* Derivative f'(x) Row */}
                          <tr className="bg-white text-slate-700">
                            <td className="border border-slate-200 p-2.5 font-black bg-slate-50 text-slate-850">إشارة f'(x)</td>
                            {aiTableData.points.map((pt: any, idx: number) => (
                              <td 
                                key={`ai-d-${idx}`} 
                                className={`border border-slate-200 p-2.5 font-mono ${
                                  pt.is_forbidden ? "text-rose-500 font-extrabold" : pt.is_peak ? "text-amber-600 font-extrabold" : ""
                                }`}
                              >
                                {pt.f_prime || (pt.type === "arrow" ? pt.f_prime : "")}
                              </td>
                            ))}
                          </tr>

                          {/* Variations f(x) Row */}
                          <tr className="bg-slate-50/20 text-slate-800">
                            <td className="border border-slate-200 p-3 font-black bg-slate-50 text-slate-850">تغيرات f(x)</td>
                            {aiTableData.points.map((pt: any, idx: number) => (
                              <td 
                                key={`ai-v-${idx}`} 
                                className={`border border-slate-200 p-3 font-semibold ${
                                  pt.type === "arrow" ? "text-lg text-emerald-600 font-bold" : pt.is_forbidden ? "text-rose-600 font-extrabold" : "font-mono"
                                }`}
                              >
                                {pt.type === "arrow" ? (
                                  pt.direction === "up" ? "↗" : "↘"
                                ) : (
                                  pt.f_val
                                )}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Meta and helper text generated by the AI */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {aiTableData.asymptotes && aiTableData.asymptotes.length > 0 && (
                        <div className="bg-emerald-950/5 p-3 rounded-xl border border-emerald-900/10 text-right space-y-1">
                          <span className="text-xs font-black text-emerald-800 block">📐 المستقيمات المقاربة النظرية:</span>
                          <ul className="list-disc list-inside text-[11px] text-slate-600 font-bold space-y-0.5">
                            {aiTableData.asymptotes.map((as: string, idx: number) => (
                              <li key={idx}>{as}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {aiTableData.criticalPoints && aiTableData.criticalPoints.length > 0 && (
                        <div className="bg-amber-950/5 p-3 rounded-xl border border-amber-900/10 text-right space-y-1">
                          <span className="text-xs font-black text-amber-800 block">📌 القيم الحدية والذروات المستنتجة:</span>
                          <ul className="list-disc list-inside text-[11px] text-slate-600 font-bold space-y-0.5">
                            {aiTableData.criticalPoints.map((cp: string, idx: number) => (
                              <li key={idx}>{cp}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {aiTableData.explanation && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-right leading-relaxed text-[11px] font-semibold text-slate-500">
                        <span className="font-bold text-slate-700 block mb-0.5">📝 تفسير اتجاه الرتابة بالتفصيل:</span>
                        {aiTableData.explanation}
                      </div>
                    )}

                    <div className="flex justify-end pt-1">
                      <button
                        onClick={generateAiVariationTable}
                        className="text-[10px] text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer bg-emerald-50/70 border border-emerald-100 hover:bg-emerald-50 px-2.5 py-1 rounded-md"
                      >
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>تحديث الدراسة والجدول بالذكاء الاصطناعي مجدداً 🪄</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* New Comprehensive Limits, Derivatives & Interactive Dialogue Station */}
          <div className={`bg-gradient-to-br from-slate-900 to-slate-950 p-6 rounded-3xl border border-emerald-500/20 shadow-xl text-right space-y-6 ${subTab === "plotter" ? "hidden" : ""}`}>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-500/20">منصة البكالوريا المتقدمة</span>
              <h4 className="text-white font-black text-base flex items-center gap-2 justify-end">
                محطة تفصيل النهايات والمشتقة مع الأستاذ دالي 🎓🧮
                <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
              </h4>
            </div>

            {/* Inline dynamic formula configuration bar */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-850 space-y-4">
              <h5 className="font-sans font-black text-xs sm:text-sm text-slate-100 flex items-center justify-end gap-1.5">
                تعديل صيغة الدالة f(x) المراد تحليلها ودراستها ⚙️🧮
                <Activity className="w-4 h-4 text-emerald-400" />
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <button
                    onClick={studyFunctionWithAI}
                    disabled={isStudyingByAi}
                    className="w-full bg-gradient-to-l from-emerald-600 via-teal-600 to-indigo-600 hover:from-emerald-700 hover:via-teal-700 hover:to-indigo-700 text-white font-black text-xs sm:text-sm py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-75 disabled:cursor-wait cursor-pointer border border-emerald-500/10"
                  >
                    {isStudyingByAi ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>الأستاذ دالي يقوم بدراستها... صبراً 🧮</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                        <span>دراسة كاملة بالذكاء الاصطناعي f(x) 🧠✨</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-2 text-emerald-400 font-serif font-black text-sm">f(x) =</span>
                  <input 
                    type="text" 
                    value={expression} 
                    onChange={(e) => setExpression(e.target.value)}
                    placeholder="مثال: (x^2 - 1) / (x - 2)"
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-xl pl-16 pr-4 py-2 text-left font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Math Helper Keyboard */}
              <div className="bg-[#0f172a]/60 p-2.5 rounded-xl border border-slate-800/80 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold font-sans">لوحة الرموز المساعدة 📐⌨️</span>
                  <button 
                    onClick={clearExpression} 
                    className="text-[10px] bg-rose-950/35 hover:bg-rose-900/40 text-rose-400 font-bold px-2 py-0.5 rounded border border-rose-900/35 transition cursor-pointer"
                  >
                    مسح C
                  </button>
                </div>
                <div className="grid grid-cols-5 gap-1.5 font-sans pb-1 text-center">
                  <button onClick={() => insertSymbol("x")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer">x</button>
                  <button onClick={() => insertSymbol("e^x")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer">e^x</button>
                  <button onClick={() => insertSymbol("ln")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">ln(x)</button>
                  <button onClick={() => insertSymbol("sqrt")} className="bg-slate-800 hover:bg-slate-700 text-emerald-400 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">√x</button>
                  <button onClick={() => insertSymbol("^2")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer">x²</button>

                  <button onClick={() => insertSymbol("^3")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer">x³</button>
                  <button onClick={() => insertSymbol("sin")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-[11px] font-mono transition active:scale-95 cursor-pointer font-sans">sin</button>
                  <button onClick={() => insertSymbol("cos")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-[11px] font-mono transition active:scale-95 cursor-pointer font-sans">cos</button>
                  <button onClick={() => insertSymbol("pi")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">π</button>
                  <button onClick={() => insertSymbol("/")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">/</button>

                  <button onClick={() => insertSymbol("*")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">*</button>
                  <button onClick={() => insertSymbol("+")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">+</button>
                  <button onClick={() => insertSymbol("-")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">-</button>
                  <button onClick={() => insertSymbol("(")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">(</button>
                  <button onClick={() => insertSymbol(")")} className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-1.5 rounded-lg border border-slate-700 font-bold text-xs font-mono transition active:scale-95 cursor-pointer font-sans">)</button>
                </div>
              </div>

              {aiStudyResult && (
                <div className="bg-slate-950 text-right p-4 rounded-xl border border-emerald-500/35 shadow-inner space-y-3 mt-4">
                  <div className="flex justify-between items-center bg-[#0f172a] -mx-4 -mt-4 px-4 py-2.5 rounded-t-xl border border-slate-800/80 font-sans">
                    <button 
                      onClick={() => setAiStudyResult(null)}
                      className="text-[10px] text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-755 px-2 py-0.5 rounded cursor-pointer"
                    >
                      إغلاق ✕
                    </button>
                    <span className="text-emerald-400 font-extrabold text-[11px] sm:text-xs flex items-center gap-1 font-sans">
                      تقرير دراسة الدالة f(x) الشامل
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                    </span>
                  </div>
                  {aiStudiedExpression && aiStudiedExpression !== expression && (
                    <div className="bg-amber-950/40 text-amber-300 p-2.5 rounded-lg text-[10.5px] border border-amber-500/20 font-bold leading-normal mb-2">
                       ⚠️ تنبيه: لقد قمت بتغيير صيغة الدالة. هذه المخرجات تخص الدالة السابقة: <code className="bg-amber-950 px-1 py-0.5 rounded text-amber-200 font-mono">{aiStudiedExpression}</code>. برجاء إعادة الدراسة بالذكاء الاصطناعي لتحديث المخرجات.
                    </div>
                  )}
                  <div className={`text-xs sm:text-sm text-slate-100 leading-relaxed max-h-80 overflow-y-auto pl-1 prose prose-sm max-w-none ${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body`} style={{ direction: "rtl" }}>
                    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{aiStudyResult}</Markdown>
                  </div>

                  {/* Interactive Student Follow-up Question Panel */}
                  <div className="border-t border-slate-700/50 pt-3 mt-4 space-y-3">
                    <div className="bg-[#0f172a] p-3 rounded-lg border border-slate-800 text-right">
                      <p className="text-xs font-bold text-amber-300 flex items-center justify-end gap-1 mb-2">
                        <span>هل هناك خطوة لم تفهمها في دراسة الدالة؟ اسأل الأستاذ دالي مباشرة:</span>
                        <QuestionIcon className="w-4 h-4 text-amber-300" />
                      </p>

                      {/* Follow-up chat messages */}
                      {studyFollowUpHistory.length > 0 && (
                        <div className="space-y-3 max-h-64 overflow-y-auto mb-3 p-2 bg-slate-950/40 rounded-lg scrollbar-thin">
                          {studyFollowUpHistory.map((msg, index) => (
                            <div key={index} className={`flex flex-col ${msg.role === "student" ? "items-start" : "items-end"} gap-1`}>
                              <span className="text-[10px] text-slate-400 font-bold px-1 font-sans">
                                {msg.role === "student" ? "أنت (التلميذ) 👤" : "الأستاذ دالي 🎓"}
                              </span>
                              <div className={`p-2.5 rounded-xl text-xs leading-relaxed prose prose-sm max-w-none markdown-body text-right ${msg.role === "student" ? "user-bubble" : "ai-bubble"} ${
                                msg.role === "student" 
                                  ? "bg-slate-800 text-slate-100 rounded-tl-none text-left" 
                                  : "bg-emerald-950/40 border border-emerald-900/40 text-slate-100 rounded-tr-none text-right whitespace-pre-line"
                              }`}>
                                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{msg.text}</Markdown>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Question input field and submit buttons */}
                      <div className="flex gap-2 font-sans">
                        <button
                          onClick={submitStudyFollowUpQuestion}
                          disabled={isStudyFollowUpLoading || !studyFollowUpText.trim()}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 disabled:opacity-50"
                        >
                          {isStudyFollowUpLoading ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CornerDownLeft className="w-3.5 h-3.5" />
                          )}
                          <span>إرسال السؤال</span>
                        </button>
                        <input
                          type="text"
                          value={studyFollowUpText}
                          onChange={(e) => setStudyFollowUpText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              submitStudyFollowUpQuestion();
                            }
                          }}
                          placeholder="مثال: لم أفهم كيف وجدت معادلة المماس، أرجو التوضيح..."
                          className="flex-1 text-xs bg-slate-950 text-white border border-slate-800 rounded-lg px-3 py-2 text-right focus:outline-none focus:ring-1 focus:ring-emerald-500 font-sans"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Math Rules Cheat Sheet */}
            <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                الدستور الذهبي لقوانين نهايات ومشتقات البكالوريا 📜
                <Info className="w-4 h-4 text-amber-400" />
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-[11px] font-semibold text-slate-300">
                <div className="bg-[#1e293b]/40 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <p className="font-bold text-emerald-400">❖ مشتقة حاصل قسمة دالتين (u/v):</p>
                  <p className="font-mono text-left text-slate-400"> (u/v)' = (u'v - uv') / v²</p>
                </div>
                <div className="bg-[#1e293b]/40 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <p className="font-bold text-emerald-400">❖ مشتقة جداء دالتين (u × v):</p>
                  <p className="font-mono text-left text-slate-400"> (u × v)' = u'v + uv'</p>
                </div>
                <div className="bg-[#1e293b]/40 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <p className="font-bold text-cyan-400">❖ نهايات ومقارب الأطراف لـ x ← x₀:</p>
                  <p className="text-slate-400">إذا كانت النهاية غير منتهية (±∞)، فإن x = x₀ مستقيم مقارب عمودي.</p>
                </div>
                <div className="bg-[#1e293b]/40 p-2.5 rounded-lg border border-slate-800 space-y-1">
                  <p className="font-bold text-cyan-400">❖ نهايات المالانهاية لـ x ← ±∞:</p>
                  <p className="text-slate-400">إذا كانت النهاية منتهية f(x) = L، فإن y = L مستقيم مقارب أفقي.</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Box A: Limits study */}
              <div className="bg-[#131b2e] p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h5 className="font-black text-sm text-slate-100 mb-2">1. حساب وتفسير النهايات ومقاربها 🔮</h5>
                  <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
                    اختر الطرف أو القيمة المستهدفة لإيجاد النهاية وتبيان المستقيم المقارب:
                  </p>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select 
                        value={limitTarget}
                        onChange={(e) => setLimitTarget(e.target.value)}
                        className="bg-slate-900 border border-slate-800 p-2 text-xs rounded-lg text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="+∞">+∞ (اللانهاية الموجبة)</option>
                        <option value="-∞">-∞ (اللانهاية السالبة)</option>
                        {forbiddenValues.map(v => (
                          <option key={`opt-l-${v}`} value={v.toString()}>{v} (قيمة ممنوعة)</option>
                        ))}
                        <option value="0">0 (المبدأ)</option>
                        <option value="custom">قيمة مخصصة أخرى...</option>
                      </select>
                      
                      {limitTarget === "custom" && (
                        <input 
                          type="text" 
                          placeholder="مثال: 1" 
                          value={customLimitVal}
                          onChange={(e) => setCustomLimitVal(e.target.value)}
                          className="bg-slate-900 border border-slate-800 px-2 py-1 text-xs rounded-lg text-white font-mono text-center focus:outline-none"
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button 
                    onClick={explainLimitWithAI}
                    disabled={isExplainingLimit}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isExplainingLimit ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isExplainingLimit ? "جاري الشرح البيداغوجي..." : "احسب وفسر النهاية بالخطوات 🔮"}</span>
                  </button>
                </div>
              </div>

              {/* Box B: Derivative and Tangent study */}
              <div className="bg-[#131b2e] p-4 rounded-2xl border border-slate-800 space-y-3 flex flex-col justify-between">
                <div>
                  <h5 className="font-black text-sm text-slate-100 mb-2">2. حساب المشتقة والتقريب الخطي 🎯</h5>
                  <p className="text-slate-400 text-[11px] mb-3 leading-relaxed">
                    احسب معامل التوجيه وقابلية الاشتقاق عند نقطة معينة لإيجاد معادلة المماس بدقة:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-serif text-xs">x₀ =</span>
                      <input 
                        type="number" 
                        step="1"
                        value={derivPoint}
                        onChange={(e) => setDerivPoint(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 p-2 text-xs rounded-lg text-white font-mono text-center focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        placeholder="أدخل نقطة التماس"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3">
                  <button 
                    onClick={explainDerivativeWithAI}
                    disabled={isExplainingDeriv}
                    className="w-full bg-gradient-to-l from-indigo-600 to-emerald-600 text-white font-extrabold text-[11px] py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isExplainingDeriv ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>{isExplainingDeriv ? "جاري حساب المشتقة..." : "اشرح المشتقة والتقريب بالتفصيل 🎯"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Explanations Display Output Area */}
            {(limitExplanation || derivExplanation) && (
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/20 space-y-4">
                {limitExplanation && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
                      <span>x → {limitTarget === "custom" ? customLimitVal : limitTarget}</span>
                      <span>🔮 شرح النهاية بالخطوات والقوانين للأستاذ دالي:</span>
                    </div>
                    <div className={`text-xs sm:text-sm text-slate-100 leading-relaxed prose prose-sm max-w-none ${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body`} style={{ direction: "rtl" }}>
                      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{limitExplanation}</Markdown>
                    </div>
                  </div>
                )}

                {derivExplanation && (
                  <div className="space-y-2 pt-2 border-t border-slate-800/60">
                    <div className="flex justify-between items-center text-xs text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
                      <span>x₀ = {derivPoint}</span>
                      <span>🎯 شرح حساب المشتقة والتعويض في معادلة المماس:</span>
                    </div>
                    <div className={`text-xs sm:text-sm text-slate-100 leading-relaxed prose prose-sm max-w-none ${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body`} style={{ direction: "rtl" }}>
                      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{derivExplanation}</Markdown>
                    </div>
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t border-slate-800/50">
                  <button 
                    onClick={() => {
                      setLimitExplanation(null);
                      setDerivExplanation(null);
                    }}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-bold cursor-pointer"
                  >
                    تنظيف النتائج ودراسة نقطة أخرى ✕
                  </button>
                </div>
              </div>
            )}

            {/* Section 3: Two-sided/interactive dialogue with Professor Dali */}
            <div className="bg-[#101726]/80 p-5 rounded-2xl border border-emerald-500/10 space-y-4">
              <h5 className="font-black text-sm text-slate-100 flex items-center justify-end gap-1.5">
                حوار مزدوج ومباشر مع الأستاذ دالي لتوضيح الخطوات 💬🤝
                <MessageSquare className="w-4 h-4 text-emerald-400 animate-pulse" />
              </h5>
              
              <p className="text-slate-400 text-[11px] leading-relaxed">
                إذا لم تفهم خطوة أو قانون نهاية ومشتقة، ادخل سؤالك هنا وسيقوم الأستاذ دالي بتبسيطها لك فوراً بالدارجة الودودة والروح الطيبة المعمرة:
              </p>

              {/* Chat thread style dialogue */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800 max-h-56 overflow-y-auto space-y-3 shadow-inner">
                {dialogueHistory.map((turn, tIdx) => (
                  <div 
                    key={`turn-${tIdx}`}
                    className={`flex flex-col ${turn.role === "student" ? "items-start text-left" : "items-end text-right"}`}
                  >
                    <span className={`text-[9px] font-bold ${turn.role === "student" ? "text-emerald-400" : "text-amber-400"} mb-0.5`}>
                      {turn.role === "student" ? "التلميذ 🙋‍♂️" : "الأستاذ دالي نجيب 🎓"}
                    </span>
                    <div className={`p-2.5 rounded-xl text-xs leading-relaxed font-medium prose prose-sm max-w-none markdown-body text-right ${turn.role === "student" ? "user-bubble" : "ai-bubble"} ${
                      turn.role === "student" 
                        ? "bg-emerald-950/40 text-slate-100 rounded-tl-none border border-emerald-900/40" 
                        : "bg-[#111827] text-slate-200 rounded-tr-none border border-slate-800"
                    }`}>
                      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{turn.text}</Markdown>
                    </div>
                  </div>
                ))}

                {isDialogueLoading && (
                  <div className="flex flex-col items-end text-right">
                    <span className="text-[9px] font-bold text-amber-500 animate-pulse">شاش الأستاذ يجتهد لك... 🧠✍️</span>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl text-xs text-slate-400 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>صبر جزيل، الأستاذ دالي يدون التبسيط في كراسك الآن...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions row for one-click action */}
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none flex-wrap justify-end">
                <span className="text-[10px] text-slate-400 font-bold ml-1">اقتراحات سريعة الأسئلة:</span>
                <button 
                  onClick={() => askDaliDialogue("كيف أزلنا حالة عدم التعيين؟ هل توجد قوانين ذهبية ثابتة؟")}
                  className="bg-slate-900 hover:bg-slate-850 p-1.5 py-1 text-[10px] text-emerald-400 font-bold rounded-md border border-slate-800 cursor-pointer"
                >
                  كيف أزلنا حالة عدم التعيين؟ 💡
                </button>
                <button 
                  onClick={() => askDaliDialogue("لم أفهم قانون مشتقة قسمة دالتين u/v في المقام، بسطها أكثر")}
                  className="bg-slate-900 hover:bg-slate-850 p-1.5 py-1 text-[10px] text-emerald-400 font-bold rounded-md border border-slate-800 cursor-pointer"
                >
                  تبسيط مشتقة u/v 🧮
                </button>
                <button 
                  onClick={() => askDaliDialogue("ماذا يعني هندسياً أن المشتقة تنعدم عند قيم الذروة وكيف يتغير اتجاه الدالة؟")}
                  className="bg-slate-900 hover:bg-slate-850 p-1.5 py-1 text-[10px] text-emerald-400 font-bold rounded-md border border-slate-800 cursor-pointer"
                >
                  معنى انعدام المشتقة هندسياً 📈
                </button>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => askDaliDialogue()}
                  disabled={isDialogueLoading || !dialogueQuery.trim()}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                >
                  <span>أرسل للأستاذ</span>
                  <CornerDownLeft className="w-3.5 h-3.5" />
                </button>

                <input 
                  type="text"
                  value={dialogueQuery}
                  onChange={(e) => setDialogueQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && dialogueQuery.trim()) {
                      askDaliDialogue();
                    }
                  }}
                  placeholder="اكتب كيف لم تفهم الخطوة ليقوم الأستاذ بتبسيطها مجدداً..."
                  className="w-full bg-slate-950 border border-slate-800 p-2.5 text-xs rounded-xl text-white font-medium text-right focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Intermediate Value Theorem widget */}
          <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 ${subTab === "analytical" ? "hidden" : ""}`}>
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
