const fs = require('fs');

let content = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');

// The prompt for study
content = content.replace(
  /أجب بتنظيم مثالي ورائع، مع الحفاظ على سرعة واختصار بيداغوجي ذكي لتحفيز التلميذ!/g,
  'أجب بتنظيم مثالي ورائع، مع الحفاظ على سرعة واختصار بيداغوجي ذكي لتحفيز التلميذ! ولتجنب اختلاط الأرقام من اليمين لليسار، ضع كل المعادلات والرموز داخل (Backticks) `مثال`.'
);

// The prompt for asking question
content = content.replace(
  /وتجنب كلياً الرموز اللاتينية الغامضة \(\$\) واكتب المعادلات بصيغة واضحة وبسيطة جداً ومسحوبة للتلميذ الجزائري بترميز قوي، وصلي على شفيعنا وحبيبنا محمد ﷺ\./g,
  'وتجنب كلياً الرموز اللاتينية الغامضة ($) وضع جميع المعادلات والرموز والأرقام داخل (Backticks) كأكواد برمجية لضمان عدم اختلاطها بأسلوب من اليمين لليسار، وصلي على شفيعنا وحبيبنا محمد ﷺ.'
);

fs.writeFileSync('src/components/MathFunctionSection.tsx', content, 'utf-8');
console.log("Math prompts fixed");
