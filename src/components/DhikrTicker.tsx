import React, { useState } from "react";
import { Sunrise, Sunset, Moon, Heart, Sparkles, Pause, Play } from "lucide-react";

interface DhikrItem {
  text: string;
  category: "morning" | "evening" | "sleep" | "general";
  type: "dua" | "quran" | "hadith";
}

const DHIKR_DATA: DhikrItem[] = [
  // --- قرآن كريم (Red Color) ---
  { text: "سورة الإخلاص: (قُلْ هُوَ اللَّهُ أَحَدٌ ۞ اللَّهُ الصَّمَدُ ۞ لَمْ يَلِدْ وَلَمْ يُولَدْ ۞ وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ)", category: "morning", type: "quran" },
  { text: "آية الكرسي: (اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ ۚ لَّهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ)", category: "morning", type: "quran" },
  { text: "سورة الفلق: (قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ ۞ مِن شَرِّ مَا خَلَقَ ۞ وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ ۞ وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ ۞ وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ)", category: "morning", type: "quran" },
  { text: "سورة الناس: (قُلْ أَعُوذُ بِرَبِّ النَّاسِ ۞ مَلِكِ النَّاسِ ۞ إِلَٰهِ النَّاسِ ۞ مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ ۞ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ ۞ مِنَ الْجِنَّةِ وَالنَّاسِ)", category: "evening", type: "quran" },
  { text: "خواتيم سورة البقرة: (آمَنَ الرَّسُولُ بِمَا أُنزِلَ إِلَيْهِ مِن رَّبِّهِ وَالْمُؤْمِنُونَ ۚ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ)", category: "sleep", type: "quran" },

  // --- أحاديث نبوية (Orange Color) ---
  { text: "قال رسول الله ﷺ: (مَنْ صَلَّى عَلَيَّ صَلَاةً وَاحِدَةً صَلَّى اللَّهُ عَلَيْهِ بِهَا عَشْرًا)", category: "general", type: "hadith" },
  { text: "قال النبي ﷺ: (كَلِمَتَانِ خَفِيفَتَانِ عَلَى اللِّسَانِ، ثَقِيلَتَانِ فِي الْمِيزَانِ، حَبِيبَتَانِ إِلَى الرَّحْمَنِ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ، سُبْحَانَ اللَّهِ الْعَظِيمِ)", category: "general", type: "hadith" },
  { text: "قال رسول الله ﷺ: (سَيِّدُ الِاسْتِغْفَارِ أَنْ تَقُولَ: اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ، خَلَقْتَنِي وَأَنَا عَبْدُكَ، وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ)", category: "morning", type: "hadith" },
  { text: "قال النبي ﷺ: (مَنْ قَالَ: سُبْحَانَ اللَّهِ وَبِحَمْدِهِ مِائَةَ مَرَّةٍ، حُطَّتْ خَطَايَاهُ وَإِنْ كَانَتْ مِثْلَ زَبَدِ الْبَحْرِ)", category: "general", type: "hadith" },
  { text: "قال رسول الله ﷺ: (مَنْ قَالَ حِينَ يُصْبِحُ وَحِينَ يُمْسِي سُبْحَانَ اللَّهِ وَبِحَمْدِهِ مِائَةَ مَرَّةٍ لَمْ يَأْتِ أَحَدٌ يَوْمَ الْقِيَامَةِ بِأَفْضَلَ مِمَّا جَاءَ بِهِ)", category: "evening", type: "hadith" },

  // --- أدعية مأثورة (Green Color) ---
  { text: "اللَّهُمَّ عافِني في بَدَني، اللَّهُمَّ عافِني في سَمْعي، اللَّهُمَّ عافِني في بَصَري، لا إلهَ إلَّا أنتَ.", category: "morning", type: "dua" },
  { text: "يَا حَيُّ يَا قَيُّومُ بِرَحْمَتِكَ أَسْتَغِيثُ، أَصْلِحْ لِي شَأْنِي كُلَّهُ، وَلَا تَكِلْنِي إِلَى نَفْسِي طَرْفَةَ عَيْنٍ.", category: "morning", type: "dua" },
  { text: "أَعُوذُ بِكَلِمَاتِ اللهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ.", category: "evening", type: "dua" },
  { text: "اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي.", category: "general", type: "dua" },
  { text: "بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ.", category: "sleep", type: "dua" },
  { text: "اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ.", category: "morning", type: "dua" },
  { text: "اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ.", category: "evening", type: "dua" }
];

interface DhikrTickerProps {
  isDarkMode?: boolean;
}

export default function DhikrTicker({ isDarkMode = true }: DhikrTickerProps) {
  // Pre-select the appropriate tab automatically based on Algerian Time (UTC + 1 hour)
  const [selectedCategory, setSelectedCategory] = useState<"morning" | "evening" | "sleep" | "general" | "all">(() => {
    try {
      const d = new Date();
      // Calculate UTC time in milliseconds, then add 1 hour (3600000ms) for Algeria timezone
      const utc = d.getTime() + d.getTimezoneOffset() * 60000;
      const algeriaDate = new Date(utc + 3600000);
      const hour = algeriaDate.getHours();
      
      if (hour >= 4 && hour < 12) {
        return "morning"; // Morning Athkar
      } else if (hour >= 12 && hour < 21) {
        return "evening"; // Evening Athkar
      } else {
        return "sleep"; // Sleeping Athkar
      }
    } catch (e) {
      return "all";
    }
  });

  const [tickerSpeed, setTickerSpeed] = useState<number>(1); // stable index, defaults to peaceful slow speed
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl"); // rtl scrolls right-to-left, ltr left-to-right

  // Filter based on selected tab
  const filteredDhikr = selectedCategory === "all" 
    ? DHIKR_DATA 
    : DHIKR_DATA.filter(item => item.category === selectedCategory);

  // Smooth duration calculation to prevent extremely fast transitions when fewer items are present
  const duration = `${(110 + filteredDhikr.length * 6) / (tickerSpeed || 1)}s`;

  return (
    <div className={`rounded-2xl border shadow-lg p-4 space-y-4 text-right transition-colors duration-250 ${
      isDarkMode 
        ? "bg-[#131b2e] border-slate-800/80 text-slate-100" 
        : "bg-white border-slate-200 text-slate-800"
    }`}>
      
      {/* Category selector menu */}
      <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b pb-3 ${
        isDarkMode ? "border-slate-800" : "border-slate-200"
      }`}>
        
        {/* Speed & Pause control */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700/45" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200"
            }`}
            title={isPaused ? "تشغيل الشريط" : "إيقاف مؤقت للشريط"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          
          <button
            type="button"
            onClick={() => setDirection(prev => prev === "rtl" ? "ltr" : "rtl")}
            className={`px-2.5 py-1.5 rounded-xl border transition-colors cursor-pointer text-xs font-bold flex items-center gap-1 ${
              isDarkMode 
                ? "bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border-slate-700/40" 
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border-slate-200"
            }`}
            title="عكس اتجاه حركة شريط الأذكار"
          >
            <span>{direction === "rtl" ? "⬅️ يسار" : "➡️ يمين"}</span>
          </button>
          
          <div className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-xl border transition-colors duration-250 ${
            isDarkMode 
              ? "text-slate-300 bg-slate-900/50 border-slate-800" 
              : "text-slate-600 bg-slate-50 border-slate-200"
          }`}>
            <span>سرعة الحركة:</span>
            <input 
              type="range"
              min="1"
              max="5"
              value={tickerSpeed}
              onChange={(e) => setTickerSpeed(parseInt(e.target.value))}
              className="w-12 h-1 accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Categories navigation options */}
        <div className="flex flex-wrap items-center gap-1.5 select-none text-xs justify-end">
          <button
            type="button"
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-emerald-600 text-white shadow shadow-emerald-700/20"
                : isDarkMode 
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/30"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-205 hover:text-slate-900 border border-slate-200"
            }`}
          >
            الكل ✨
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("morning")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedCategory === "morning"
                ? "bg-emerald-600 text-white shadow shadow-emerald-700/20"
                : isDarkMode 
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/30"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-205 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Sunrise className="w-3.5 h-3.5 text-amber-400" />
            <span>صباح</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("evening")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedCategory === "evening"
                ? "bg-emerald-600 text-white shadow shadow-emerald-700/20"
                : isDarkMode 
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/30"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-205 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Sunset className="w-3.5 h-3.5 text-indigo-400" />
            <span>مساء</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("sleep")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedCategory === "sleep"
                ? "bg-emerald-600 text-white shadow shadow-emerald-700/20"
                : isDarkMode 
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/30"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-205 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-300" />
            <span>نوم</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory("general")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedCategory === "general"
                ? "bg-emerald-600 text-white shadow shadow-emerald-700/20"
                : isDarkMode 
                  ? "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/30"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-205 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>تسبيحات</span>
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-1.5 order-first md:order-last justify-end">
          <span className={`font-black text-xs transition-colors duration-250 ${
            isDarkMode ? "text-white" : "text-slate-900"
          }`}>شريط الأذكار اليومي للبركة والطمأنينة</span>
          <span className="text-[14px]">🕌</span>
        </div>

      </div>

      {/* Scrolling Text marquee container - uses stable index.css classes */}
      <div className={`border rounded-xl py-3.5 px-4 overflow-hidden relative shadow-inner transition-colors duration-250 ${
        isDarkMode ? "bg-slate-950/70 border-slate-850" : "bg-[#f8fafc] border-slate-200"
      }`}>
        <div className={`absolute right-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-l ${
          isDarkMode ? "from-[#131b2e] via-[#131b2e]/60 to-transparent" : "from-white via-white/60 to-transparent"
        }`}></div>
        <div className={`absolute left-0 top-0 bottom-0 w-12 z-10 pointer-events-none bg-gradient-to-r ${
          isDarkMode ? "from-[#131b2e] via-[#131b2e]/60 to-transparent" : "from-white via-white/60 to-transparent"
        }`}></div>

        <div className="w-full overflow-hidden flex" dir="ltr">
          {/* We use two identical blocks scrolling from 0 to -100% to create a perfect infinite loop */}
          {[1, 2].map((blockNo) => (
            <div 
              key={`marquee-block-${blockNo}`}
              className={`flex items-center shrink-0 custom-marquee-block ${direction}`}
              style={{
                "--marquee-duration": duration,
                "--marquee-play-state": isPaused ? "paused" : "running"
              } as React.CSSProperties}
            >
              {/* Ensure enough content width by repeating the items inside each block */}
              {[1, 2, 3, 4].map((trackNo) => (
                <div key={`track-no-${trackNo}`} className="flex items-center gap-6 shrink-0 pl-8">
                   {filteredDhikr.map((item, idx) => {
                     let textColorClass = isDarkMode ? "text-slate-200" : "text-slate-800";
                     let badgeColorClass = isDarkMode 
                       ? "text-emerald-400 bg-emerald-950/80 border-emerald-900/50" 
                       : "text-emerald-700 bg-emerald-50 border-emerald-200";
                     let typeLabel = "ذكر";
                     
                     if (item.type === "quran") {
                       textColorClass = isDarkMode 
                         ? "text-red-400 font-bold drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]" 
                         : "text-red-700 font-extrabold";
                       badgeColorClass = isDarkMode 
                         ? "text-red-400 bg-red-950/80 border-red-900/50" 
                         : "text-red-700 bg-red-50 border-red-200";
                       typeLabel = "📖 قرآن كريم";
                     } else if (item.type === "hadith") {
                       textColorClass = isDarkMode 
                         ? "text-orange-400 font-bold drop-shadow-[0_0_3px_rgba(249,115,22,0.55)]" 
                         : "text-orange-700 font-extrabold";
                       badgeColorClass = isDarkMode 
                         ? "text-orange-400 bg-orange-950/80 border-orange-900/50" 
                         : "text-orange-700 bg-orange-50 border-orange-200";
                       typeLabel = "💬 حديث شريف";
                     } else if (item.type === "dua") {
                       textColorClass = isDarkMode 
                         ? "text-emerald-400 font-bold drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]" 
                         : "text-emerald-700 font-extrabold";
                       badgeColorClass = isDarkMode 
                         ? "text-emerald-400 bg-emerald-950/80 border-emerald-900/50" 
                         : "text-emerald-600 bg-emerald-50 border-emerald-200";
                       typeLabel = "🤲 دعاء كريم";
                     }

                     return (
                       <span key={`ticker-item-${trackNo}-${idx}`} className="inline-flex items-center mx-5 select-none">
                         <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ml-2.5 border ${badgeColorClass}`}>
                           {typeLabel}
                           <span className="opacity-70 font-medium mr-1">
                             ({item.category === "morning" && "صباح"}
                              {item.category === "evening" && "مساء"}
                              {item.category === "sleep" && "نوم"}
                              {item.category === "general" && "عام"})
                           </span>
                         </span>
                         <span className={`text-xs sm:text-sm tracking-wide leading-relaxed font-sans ${textColorClass}`}>{item.text}</span>
                         <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 mr-4 shrink-0 animate-pulse" />
                       </span>
                     );
                   })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={`flex items-center justify-between text-[10px] sm:text-xs px-1 font-medium select-none transition-colors duration-250 ${
        isDarkMode ? "text-slate-400" : "text-slate-600"
      }`}>
        <span>تلميح: مرر مؤشر الماوس فوق أي ذكر لإيقافه وثباته لقراءته بتمعّن 🎯</span>
        <span>صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَآلِهِ 💖</span>
      </div>

    </div>
  );
}
