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

export default function DhikrTicker() {
  const [selectedCategory, setSelectedCategory] = useState<"morning" | "evening" | "sleep" | "general" | "all">("all");
  const [tickerSpeed, setTickerSpeed] = useState<number>(1); // default slow and peaceful speed
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl"); // rtl scrolls right-to-left, ltr scrolls left-to-right

  // Filter based on selected tab
  const filteredDhikr = selectedCategory === "all" 
    ? DHIKR_DATA 
    : DHIKR_DATA.filter(item => item.category === selectedCategory);


  return (
    <div className="bg-[#131b2e] rounded-2xl border border-slate-800/80 shadow-lg p-4 space-y-4 text-right">
      
      {/* Category selector menu */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        
        {/* Speed & Pause control */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/40 transition-colors cursor-pointer"
            title={isPaused ? "تشغيل الشريط" : "إيقاف مؤقت للشريط"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          
          <button
            type="button"
            onClick={() => setDirection(prev => prev === "rtl" ? "ltr" : "rtl")}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700/40 transition-colors cursor-pointer text-xs font-bold flex items-center gap-1"
            title="عكس اتجاه حركة شريط الأذكار"
          >
            <span>{direction === "rtl" ? "⬅️ يسار" : "➡️ يمين"}</span>
          </button>
          
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-800">
            <span>سرعة الحركة:</span>
            <input 
              type="range"
              min="1"
              max="5"
              value={tickerSpeed}
              onChange={(e) => setTickerSpeed(parseInt(e.target.value))}
              className="w-12 h-1 accent-emerald-500 cursor-pointer bg-slate-800"
            />
          </div>
        </div>

        {/* Categories navigation options */}
        <div className="flex flex-wrap items-center gap-1.5 select-none text-xs justify-end">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              selectedCategory === "all"
                ? "bg-emerald-600 text-white shadow shadow-emerald-700/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-705/30"
            }`}
          >
            الكل ✨
          </button>
          <button
            onClick={() => setSelectedCategory("morning")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedCategory === "morning"
                ? "bg-emerald-600 text-white shadow shadow-emerald-700/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-705/30"
            }`}
          >
            <Sunrise className="w-3.5 h-3.5 text-amber-400" />
            <span>صباح</span>
          </button>
          <button
            onClick={() => setSelectedCategory("evening")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedCategory === "evening"
                ? "bg-emerald-600 text-white shadow shadow-emerald-700/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-705/30"
            }`}
          >
            <Sunset className="w-3.5 h-3.5 text-indigo-400" />
            <span>مساء</span>
          </button>
          <button
            onClick={() => setSelectedCategory("sleep")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedCategory === "sleep"
                ? "bg-emerald-600 text-white shadow shadow-emerald-700/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-705/30"
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-300" />
            <span>نوم</span>
          </button>
          <button
            onClick={() => setSelectedCategory("general")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer ${
              selectedCategory === "general"
                ? "bg-emerald-600 text-white shadow shadow-emerald-700/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-705/30"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>تسبيحات</span>
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-1.5 order-first md:order-last justify-end">
          <span className="text-white font-bold text-xs">شريط الأذكار اليومي للبركة والطمأنينة</span>
          <span className="text-[14px]">🕌</span>
        </div>

      </div>

      {/* Scrolling Text marquee container using native CSS keyframes to support custom speeds and pausings */}
      <div className="bg-slate-950/70 border border-slate-850 rounded-xl py-3.5 px-4 overflow-hidden relative shadow-inner">
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#131b2e] via-[#131b2e]/60 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#131b2e] via-[#131b2e]/60 to-transparent z-10 pointer-events-none"></div>
        
        <style>{`
          @keyframes marquee-rtl {
            0% { transform: translate3d(0%, 0, 0); }
            100% { transform: translate3d(-50%, 0, 0); }
          }
          @keyframes marquee-ltr {
            0% { transform: translate3d(-50%, 0, 0); }
            100% { transform: translate3d(0%, 0, 0); }
          }
          .custom-marquee-scroll {
            display: flex;
            width: max-content;
          }
          .custom-marquee-scroll.rtl {
            animation: marquee-rtl var(--marquee-duration, 225s) linear infinite;
            animation-play-state: var(--marquee-play-state, running);
          }
          .custom-marquee-scroll.ltr {
            animation: marquee-ltr var(--marquee-duration, 225s) linear infinite;
            animation-play-state: var(--marquee-play-state, running);
          }
          .custom-marquee-scroll:hover {
            animation-play-state: paused;
          }
        `}</style>

        <div className="w-full overflow-hidden">
          <div 
            className={`custom-marquee-scroll flex items-center whitespace-nowrap ${direction}`}
            style={{
              "--marquee-duration": `${(30 + filteredDhikr.length * 1.5) / (tickerSpeed || 1)}s`,
              "--marquee-play-state": isPaused ? "paused" : "running"
            } as React.CSSProperties}
          >
            {/* Render 4 copies side-by-side to allow seamless continuous wrap-around without empty space */}
            {[1, 2, 3, 4].map((trackNo) => (
              <div key={`track-no-${trackNo}`} className="flex items-center gap-6 shrink-0 pl-8">
                 {filteredDhikr.map((item, idx) => {
                   let textColorClass = "text-slate-100";
                   let badgeColorClass = "text-emerald-400 bg-emerald-950/80 border-emerald-900/50";
                   let typeLabel = "ذكر";
                   
                   if (item.type === "quran") {
                     textColorClass = "text-red-400 font-semibold drop-shadow-[0_0_3px_rgba(239,68,68,0.5)]";
                     badgeColorClass = "text-red-400 bg-red-950/80 border-red-900/50";
                     typeLabel = "📖 قرآن كريم";
                   } else if (item.type === "hadith") {
                     textColorClass = "text-orange-400 font-semibold drop-shadow-[0_0_3px_rgba(249,115,22,0.55)]";
                     badgeColorClass = "text-orange-400 bg-orange-950/80 border-orange-900/50";
                     typeLabel = "💬 حديث شريف";
                   } else if (item.type === "dua") {
                     textColorClass = "text-emerald-400 font-semibold drop-shadow-[0_0_3px_rgba(16,185,129,0.5)]";
                     badgeColorClass = "text-emerald-400 bg-emerald-950/80 border-emerald-900/50";
                     typeLabel = "🤲 دعاء كريم";
                   }

                   return (
                     <span key={`ticker-item-${trackNo}-${idx}`} className="inline-flex items-center mx-5 select-none">
                       <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ml-2.5 border ${badgeColorClass}`}>
                         {typeLabel}
                         <span className="opacity-60 font-medium mr-1">
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
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] sm:text-xs text-slate-400 px-1 font-medium select-none">
        <span>تلميح: مرر مؤشر الماوس فوق أي ذكر لإيقافه وقراءته بتمعّن 🎯</span>
        <span>صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَآلِهِ 💖</span>
      </div>

    </div>
  );
}
