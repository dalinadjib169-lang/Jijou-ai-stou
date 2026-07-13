const fs = require('fs');

let content = fs.readFileSync('src/components/ChatSection.tsx', 'utf-8');

content = content.replace(
  /<div className=\{\`flex flex-col \$\{msg\.sender === "user" \? "max-w-\[85%\]" : "w-full"\} \$\{\n\s*msg\.sender === "user" \? "items-end" : "items-start"\n\s*\}\`\}>/g,
  '<div className={`flex flex-col ${msg.sender === "user" ? "user-bubble items-end" : "ai-bubble items-start"}`}>'
);

// We also need to fix math chat bubbles
let contentMath = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');

contentMath = contentMath.replace(
  /className=\{\`p-2\.5 rounded-xl text-xs leading-relaxed prose prose-sm max-w-none markdown-body text-right \$\{msg\.role === "student" \? "max-w-\[85%\]" : "w-full"\}/g,
  'className={`p-2.5 rounded-xl text-xs leading-relaxed prose prose-sm max-w-none markdown-body text-right ${msg.role === "student" ? "user-bubble" : "ai-bubble"}'
);

contentMath = contentMath.replace(
  /className=\{\`p-2\.5 rounded-xl text-xs leading-relaxed font-medium prose prose-sm max-w-none markdown-body text-right \$\{turn\.role === "student" \? "max-w-\[85%\]" : "w-full"\}/g,
  'className={`p-2.5 rounded-xl text-xs leading-relaxed font-medium prose prose-sm max-w-none markdown-body text-right ${turn.role === "student" ? "user-bubble" : "ai-bubble"}'
);

fs.writeFileSync('src/components/ChatSection.tsx', content, 'utf-8');
fs.writeFileSync('src/components/MathFunctionSection.tsx', contentMath, 'utf-8');
console.log("Bubbles fixed");
