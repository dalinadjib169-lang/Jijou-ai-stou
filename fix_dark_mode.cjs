const fs = require('fs');

let chat = fs.readFileSync('src/components/ChatSection.tsx', 'utf-8');
chat = chat.replace(/interface ChatSectionProps \{/, 'interface ChatSectionProps {\n  isDarkMode?: boolean;');
chat = chat.replace(/selectedKeyIndex = -1,/, 'selectedKeyIndex = -1,\n  isDarkMode = true,');
chat = chat.replace(/text-white prose-invert prose-p:leading-relaxed prose-headings:text-emerald-400 prose-a:text-amber-400 prose-strong:text-white prose-pre:bg-slate-900 prose-pre:border-slate-800/g,
  "${isDarkMode ? 'text-white prose-invert prose-headings:text-emerald-400 prose-a:text-amber-400 prose-strong:text-white prose-pre:bg-slate-900 prose-pre:border-slate-800' : 'text-slate-800 prose-headings:text-emerald-700 prose-a:text-emerald-600 prose-strong:text-slate-900 prose-pre:bg-slate-100 prose-pre:border-slate-200'} prose-p:leading-relaxed"
);
fs.writeFileSync('src/components/ChatSection.tsx', chat, 'utf-8');

let math = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');
math = math.replace(/interface MathFunctionSectionProps \{/, 'interface MathFunctionSectionProps {\n  isDarkMode?: boolean;');
math = math.replace(/selectedKeyIndex = -1,/, 'selectedKeyIndex = -1,\n  isDarkMode = true,');

// replace systemAnswer
math = math.replace(/prose prose-sm max-w-none prose-p:leading-relaxed prose-headings:text-emerald-700 prose-strong:text-slate-900/g,
  'prose prose-sm max-w-none prose-p:leading-relaxed ${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"}'
);

// aiStudyResult, mStudyResult, limitExplanation, derivExplanation, msg.text, turn.text
math = math.replace(/prose-invert/g, '${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"}');

fs.writeFileSync('src/components/MathFunctionSection.tsx', math, 'utf-8');
console.log("Done");
