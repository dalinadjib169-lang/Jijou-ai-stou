const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Add isDarkMode={isDarkMode} to ChatSection and MathFunctionSection
content = content.replace(/<ChatSection/g, '<ChatSection isDarkMode={isDarkMode}');
content = content.replace(/<MathFunctionSection/g, '<MathFunctionSection isDarkMode={isDarkMode}');

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("Done");
