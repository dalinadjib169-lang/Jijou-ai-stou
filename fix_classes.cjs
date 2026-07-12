const fs = require('fs');

function fixJSXStringLiteral(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // replace className="... ${...} ..." with className={`... ${...} ...`}
  content = content.replace(/className="([^"]*\$\{isDarkMode[^}]*\}[^"]*)"/g, (match, p1) => {
    // p1 might have unescaped quotes from inside the ternary, let's fix it manually.
    return match; // skip for now
  });

  fs.writeFileSync(filePath, content, 'utf-8');
}

fixJSXStringLiteral('src/components/MathFunctionSection.tsx');
fixJSXStringLiteral('src/components/ChatSection.tsx');

