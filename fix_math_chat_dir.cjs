const fs = require('fs');
let content = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');

// The math chat bubbles have markdown-body
content = content.replace(
  /className=\{\`p-2\.5 rounded-xl text-xs leading-relaxed \$\{msg.role === "student" \? "max-w-\[85%\]" : "w-full"\} \$\{(.*?)\}\`\}>/g,
  'className={`p-2.5 rounded-xl text-xs leading-relaxed markdown-body ${msg.role === "student" ? "max-w-[85%]" : "w-full"} ${$1}`} style={{ direction: "rtl" }}>'
);
content = content.replace(
  /className=\{\`p-2\.5 rounded-xl text-xs leading-relaxed font-medium \$\{turn.role === "student" \? "max-w-\[85%\]" : "w-full"\} \$\{(.*?)\}\`\}>/g,
  'className={`p-2.5 rounded-xl text-xs leading-relaxed font-medium markdown-body ${turn.role === "student" ? "max-w-[85%]" : "w-full"} ${$1}`} style={{ direction: "rtl" }}>'
);
fs.writeFileSync('src/components/MathFunctionSection.tsx', content, 'utf-8');
console.log("Math dir fixed");
