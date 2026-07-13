const fs = require('fs');
let chat = fs.readFileSync('src/components/ChatSection.tsx', 'utf-8');
chat = chat.replace(/apiKeys: string\[\];/g, '');
chat = chat.replace(/keyRotationMode: "sequential" \| "manual";/g, '');
chat = chat.replace(/selectedKeyIndex: number;/g, '');
chat = chat.replace(/apiKeys,[\s\n]*keyRotationMode,[\s\n]*selectedKeyIndex,/g, '');
chat = chat.replace(/keyRotationMode,\s*selectedKeyIndex/g, '');

let math = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');
math = math.replace(/apiKeys: string\[\];/g, '');
math = math.replace(/keyRotationMode: "sequential" \| "manual";/g, '');
math = math.replace(/selectedKeyIndex: number;/g, '');
math = math.replace(/apiKeys,[\s\n]*keyRotationMode,[\s\n]*selectedKeyIndex,/g, '');
math = math.replace(/keyRotationMode,\s*selectedKeyIndex/g, '');

fs.writeFileSync('src/components/ChatSection.tsx', chat, 'utf-8');
fs.writeFileSync('src/components/MathFunctionSection.tsx', math, 'utf-8');
console.log("Sections updated");
