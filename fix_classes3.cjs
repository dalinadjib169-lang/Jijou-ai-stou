const fs = require('fs');

let content = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');

content = content.replace(/className="([^"]*\$\{isDarkMode[^}]*\}[^"]*)"/g, (match, p1) => {
  return `className={\`${p1}\`}`;
});

fs.writeFileSync('src/components/MathFunctionSection.tsx', content, 'utf-8');
console.log("Done");
