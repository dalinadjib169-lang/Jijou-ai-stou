const fs = require('fs');
let math = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');

math = math.replace(
  /<textarea\s+value=\{studentQuestion\}[\s\S]*?className="w-full p-3 font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500\/20 text-right leading-relaxed h-16"/g,
  `<textarea 
                value={studentQuestion}
                onChange={(e) => setStudentQuestion(e.target.value)}
                placeholder="اكتب سؤالك بخصوص الدالة هنا..."
                className="w-full p-2.5 font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-right leading-relaxed h-14 min-w-0 resize-none"`
);

fs.writeFileSync('src/components/MathFunctionSection.tsx', math, 'utf-8');
console.log("MathFunctionSection textarea patched");
