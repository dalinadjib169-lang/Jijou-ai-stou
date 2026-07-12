const fs = require('fs');

let content = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');

const replacementMap = [
  {
    target: `className="text-xs sm:text-sm text-slate-100 leading-relaxed max-h-80 overflow-y-auto pl-1 text-right font-sans shadow-sm prose prose-sm max-w-none \${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body"`,
    replacement: `className={\`text-xs sm:text-sm text-slate-100 leading-relaxed max-h-80 overflow-y-auto pl-1 text-right font-sans shadow-sm prose prose-sm max-w-none \${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body\`}`
  },
  {
    target: `className="text-xs sm:text-sm leading-relaxed max-h-72 overflow-y-auto pl-1 font-bold prose prose-sm max-w-none \${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body"`,
    replacement: `className={\`text-xs sm:text-sm leading-relaxed max-h-72 overflow-y-auto pl-1 font-bold prose prose-sm max-w-none \${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body\`}`
  },
  {
    target: `className="bg-gradient-to-l from-emerald-50/70 to-teal-50/30 border border-emerald-200/60 rounded-xl p-4 text-xs text-slate-700 leading-relaxed text-right max-h-60 overflow-y-auto prose prose-sm max-w-none prose-p:leading-relaxed \${isDarkMode ? "\${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} markdown-body"`,
    replacement: `className={\`bg-gradient-to-l from-emerald-50/70 to-teal-50/30 border border-emerald-200/60 rounded-xl p-4 text-xs text-slate-700 leading-relaxed text-right max-h-60 overflow-y-auto prose prose-sm max-w-none prose-p:leading-relaxed \${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} markdown-body\`}`
  },
  {
    target: `className="text-xs sm:text-sm text-slate-100 leading-relaxed max-h-80 overflow-y-auto pl-1 prose prose-sm max-w-none \${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body"`,
    replacement: `className={\`text-xs sm:text-sm text-slate-100 leading-relaxed max-h-80 overflow-y-auto pl-1 prose prose-sm max-w-none \${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body\`}`
  },
  {
    target: `className="text-xs sm:text-sm text-slate-100 leading-relaxed prose prose-sm max-w-none \${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body"`,
    replacement: `className={\`text-xs sm:text-sm text-slate-100 leading-relaxed prose prose-sm max-w-none \${isDarkMode ? "prose-invert prose-headings:text-emerald-400 prose-strong:text-white" : "prose-headings:text-emerald-700 prose-strong:text-slate-900"} prose-p:leading-relaxed markdown-body\`}`
  }
];

replacementMap.forEach(({target, replacement}) => {
  content = content.replace(target, replacement);
});

fs.writeFileSync('src/components/MathFunctionSection.tsx', content, 'utf-8');
console.log("Done");
