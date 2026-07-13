const fs = require('fs');
let admin = fs.readFileSync('src/components/AdminSection.tsx', 'utf-8');

admin = admin.replace(
  /const \[codePoints, setCodePoints\] = useState\(50\);\n  const \[generatedCode, setGeneratedCode\] = useState\(""\);\n  const \[isGeneratingCode, setIsGeneratingCode\] = useState\(false\);/,
  ''
);

admin = admin.replace(
  /const handleGenerateCode = async \(\) => {[\s\S]*?};\n/,
  ''
);

admin = admin.replace(
  /{\/\* Codes Generator Section \*\/}[\s\S]*?<\/div>\s*<\/div>\s*<div className="pt-4 flex items-center justify-between">/m,
  '<div className="pt-4 flex items-center justify-between">'
);

fs.writeFileSync('src/components/AdminSection.tsx', admin, 'utf-8');
console.log("Admin patched");
