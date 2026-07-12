const fs = require('fs');
let content = fs.readFileSync('src/components/ChatSection.tsx', 'utf-8');
content = content.replace(
  /className="w-9 h-9 rounded-full object-cover border border-emerald-500 shadow animate-fade-in"/g,
  'className="w-9 h-9 shrink-0 rounded-full object-cover border border-emerald-500 shadow animate-fade-in"'
);
content = content.replace(
  /className="w-9 h-9 rounded-full object-cover border border-emerald-500"/g,
  'className="w-9 h-9 shrink-0 rounded-full object-cover border border-emerald-500"'
);
fs.writeFileSync('src/components/ChatSection.tsx', content, 'utf-8');
console.log("Avatar shrink fixed");
