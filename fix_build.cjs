const fs = require('fs');
let content = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');

// I put a backtick in the prompt string which broke the template literal!
content = content.replace(
  /داخل \(Backticks\) \`مثال\`\./g,
  'داخل (Backticks) كمثال برمجية.'
);
fs.writeFileSync('src/components/MathFunctionSection.tsx', content, 'utf-8');
console.log("Fixed build");
