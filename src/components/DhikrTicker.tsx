import React, { useState } from "react";
import { Sunrise, Sunset, Moon, Heart, Sparkles, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

interface DhikrItem {
  text: string;
  category: "morning" | "evening" | "sleep" | "general";
}

const DHIKR_DATA: DhikrItem[] = [
  // Morning Dhikr
  { text: "أصبحنا وأصبح الملك لله، والحمد لله، لا إله إلا الله وحده لا شريك له، له الملك وله الحمد وهو على كل شيء قدير.", category: "morning" },
  { text: "اللهم بك أصبحنا، وبك أمسينا، وبك نحيا، وبك نموت، وإليك النشور.", category: "morning" },
  { text: "رضيت بالله رباً، وبالإسلام ديناً، وبمحمد ﷺ نبياً ورسولاً.", category: "morning" },
  { text: "يا حي يا قيوم برحمتك أستغيث أصلح لي شأني كله ولا تكلني إلى نفسي طرفة عين.", category: "morning" },
  { text: "اللهم ما أصبح بي من نعمة أو بأحد من خلقك فمنك وحدك لا شريك لك، فلك الحمد ولك الشكر.", category: "morning" },
  { text: "أصبحنا على فطرة الإسلام وعلم الإخلاص ودين نبيّنا محمد ﷺ ملة أبينا إبراهيم حنيفاً مسلماً وما كان من المشركين.", category: "morning" },

  // Evening Dhikr
  { text: "أمسينَا وأمسَى الملكُ للهِ والحمدُ للهِ، لا إلهَ إلا اللهُ وحدَهُ لا شريكَ لهُ، لهُ الملكُ ولهُ الحمدُ وهوَ على كلِّ شيءٍ قديرٌ.", category: "evening" },
  { text: "اللهم بك أمسينا، وبك أصبحنا، وبك نحيا، وبك نموت، وإليك المصير.", category: "evening" },
  { text: "اللهم إنّي أمسيتُ أُشهدك، وأُشهدُ حملةَ عرشك وملائكتك وجميع خلقك أنك أنت الله لا إله إلا أنت.", category: "evening" },
  { text: "أعوذ بكلمات الله التامات من شر ما خلق.", category: "evening" },
  { text: "اللهم عافني في بدني، اللهم عافني في سمعي، اللهم عافني في بصري، لا إله إلا أنت.", category: "evening" },

  // Sleep Dhikr
  { text: "باسمك ربي وضعت جنبي، وبك أرفعه، فإن أمسكت نفسي فارحمها، وإن أرسلتها فاحفظها بما تحفظ به عبادك الصالحين.", category: "sleep" },
  { text: "اللهم قني عذابك يوم تبعث عبادك.", category: "sleep" },
  { text: "الحمد لله الذي أطعمنا وسقانا، وكفانا وآوانا، فكم ممن لا كافي له ولا مؤوي.", category: "sleep" },
  { text: "اللهم أسلمت نفسي إليك، وفوضت أمري إليك، ووجهت وجهي إليك، وألجأت ظهري إليك، رغبة ورهبة إليك.", category: "sleep" },

  // General Dhikr & Supplications
  { text: "سبحان الله وبحمده، عدد خلقه، ورضا نفسه، وزنة عرشه، ومداد كلماته.", category: "general" },
  { text: "اللهم صلِّ وسلم وبارك على نبينا محمد وعلى آله وصحبه أجمعين.", category: "general" },
  { text: "لا إله إلا أنت سبحانك إني كنت من الظالمين.", category: "general" },
  { text: "استغفر الله العظيم الذي لا إله إلا هو الحي القيوم وأتوب إليه.", category: "general" },
  { text: "سبحان الله، والحمد لله، ولا إله إلا الله، والله أكبر، ولا حول ولا قوة إلا بالله العلي العظيم.", category: "general" },
  { text: "اللهم إنك عفو تحب العفو فاعفُ عني.", category: "general" }
];

export default function DhikrTicker() {
  const [selectedCategory, setSelectedCategory] = useState<"morning" | "evening" | "sleep" | "general" | "all">("all");
  const [tickerSpeed, setTickerSpeed] = useState<number>(3); // scrollamount
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // Filter based on selected tab
  const filteredDhikr = selectedCategory === "all" 
    ? DHIKR_DATA 
    : DHIKR_DATA.filter(item => item.category === selectedCategory);

  // Joining all text components with space divider
  const scrollingText = filteredDhikr.map((item, idx) => (
    <span key={idx} className="inline-flex items-center mx-8 text-slate-800 font-medium">
      <span className="text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[10px] font-bold ml-2 shadow-sm border border-emerald-100">
        {item.category === "morning" && "صباح"}
        {item.category === "evening" && "مساء"}
        {item.category === "sleep" && "نوم"}
        {item.category === "general" && "ذكر"}
      </span>
      <span className="text-sm md:text-base tracking-wide leading-relaxed font-serif select-none">{item.text}</span>
      <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 mr-4 shrink-0 animate-pulse" />
    </span>
  ));

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 text-right">
      
      {/* Category selector menu */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        
        {/* Speed & Pause control */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            title={isPaused ? "تشغيل الشريط" : "إيقاف مؤقت للشريط"}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
          
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
            <span>سرعة الحركة:</span>
            <input 
              type="range"
              min="1"
              max="6"
              value={tickerSpeed}
              onChange={(e) => setTickerSpeed(parseInt(e.target.value))}
              className="w-12 h-1 accent-emerald-600"
            />
          </div>
        </div>

        {/* Categories navigation options */}
        <div className="flex flex-wrap items-center gap-1.5 select-none text-xs">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
              selectedCategory === "all"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/15"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            الكل ✨
          </button>
          <button
            onClick={() => setSelectedCategory("morning")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              selectedCategory === "morning"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/15"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Sunrise className="w-3.5 h-3.5 text-amber-500" />
            <span>أذكار الصباح</span>
          </button>
          <button
            onClick={() => setSelectedCategory("evening")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              selectedCategory === "evening"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/15"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Sunset className="w-3.5 h-3.5 text-indigo-500" />
            <span>أذكار المساء</span>
          </button>
          <button
            onClick={() => setSelectedCategory("sleep")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              selectedCategory === "sleep"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/15"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-indigo-900" />
            <span>أذكار النوم</span>
          </button>
          <button
            onClick={() => setSelectedCategory("general")}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
              selectedCategory === "general"
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/15"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>تسبيح وأدعية</span>
          </button>
        </div>

        {/* Title */}
        <div className="flex items-center gap-1.5 order-first md:order-last">
          <span className="text-slate-700 font-bold text-xs">شريط الأذكار اليومي للبركة والطمأنينة</span>
          <span className="text-[14px]">🕌</span>
        </div>

      </div>

      {/* Scrolling Text marquee container */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 overflow-hidden relative shadow-inner">
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-50 to-transparent z-10 pointer-events-none"></div>
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-50 to-transparent z-10 pointer-events-none"></div>
        
        {/* We use standard marquee but support complete reactive control & hover settings */}
        <marquee
          scrollamount={isPaused ? 0 : tickerSpeed}
          direction="right"
          className="w-full block"
          onMouseOver={(e: any) => {
            if (!isPaused) e.currentTarget.setAttribute("scrollamount", "0");
          }}
          onMouseOut={(e: any) => {
            if (!isPaused) e.currentTarget.setAttribute("scrollamount", tickerSpeed.toString());
          }}
        >
          {scrollingText}
        </marquee>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 px-1 font-medium select-none">
        <span>تلميح: مرر مؤشر الماوس فوق أي ذكر لإيقافه وقراءته بتمعّن 🎯</span>
        <span>صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَآلِهِ 💖</span>
      </div>

    </div>
  );
}
