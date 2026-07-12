const fs = require('fs');

let content = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');

// Ensure no duplicated `}`} style={{ direction: "rtl" }}`
content = content.replace(/text-right whitespace-pre-line"\}\`\}\} style=\{\{ direction: "rtl" \}\}/g, 'text-right whitespace-pre-line"}');
fs.writeFileSync('src/components/MathFunctionSection.tsx', content, 'utf-8');
console.log("Cleaned up MathFunctionSection");
