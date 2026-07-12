const fs = require('fs');

let content = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');

// The math chat bubbles have max-w-[85%]
// Let's replace them to w-full for assistant, max-w-[85%] for student
content = content.replace(
  /className=\{\`p-2\.5 rounded-xl text-xs max-w-\[85%\] leading-relaxed \$\{/g,
  'className={`p-2.5 rounded-xl text-xs leading-relaxed ${msg.role === "student" ? "max-w-[85%]" : "w-full"} ${'
);

content = content.replace(
  /className=\{\`p-2\.5 rounded-xl text-xs leading-relaxed max-w-\[85%\] font-medium \$\{/g,
  'className={`p-2.5 rounded-xl text-xs leading-relaxed font-medium ${turn.role === "student" ? "max-w-[85%]" : "w-full"} ${'
);

fs.writeFileSync('src/components/MathFunctionSection.tsx', content, 'utf-8');
console.log("MathFunctionSection fixed");
