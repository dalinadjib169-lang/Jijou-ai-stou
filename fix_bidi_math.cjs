const fs = require('fs');

// 1. Update the system prompt to explicitly require backticks for math
let server = fs.readFileSync('server.ts', 'utf-8');
const oldRule6 = /6\. المنهاج والرياضيات.*?\n/;
const newRule6 = `6. المنهاج والرياضيات والرموز: ادعم ووجه التلاميذ في جميع المواد التعليمية وخاصة الرياضيات. **مهم جداً جداً**: لحل مشكلة اختلاط وتداخل الرموز عند العرض من اليمين لليسار، يجب عليك وضع أي معادلة رياضية أو متغير أو أرقام داخل علامتي التنصيص البرمجية (Backticks) ككود برمجي، مثال: \`f(x) = 2x + 1\` أو \`x1 = (-b - √Δ) / 2a\`. يمنع استخدام رمز الدولار ($).\n`;
server = server.replace(oldRule6, newRule6);
fs.writeFileSync('server.ts', server, 'utf-8');

// 2. Add CSS to enforce LTR on code tags inside markdown-body
let css = fs.readFileSync('src/index.css', 'utf-8');
if (!css.includes('.markdown-body code')) {
  css += `\n/* Fix Bidi Math Rendering */\n.markdown-body code {\n  direction: ltr !important;\n  unicode-bidi: embed;\n  display: inline-block;\n  text-align: left;\n}\n`;
  fs.writeFileSync('src/index.css', css, 'utf-8');
}

console.log("Bidi math fixed");
