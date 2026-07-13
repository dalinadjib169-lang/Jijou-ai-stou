const fs = require('fs');
let content = fs.readFileSync('src/components/AdminSection.tsx', 'utf-8');
content = content.replace(/const newCode =.*/, 'const newCode = `DALI-${randomPart}-${codePoints}`;');
fs.writeFileSync('src/components/AdminSection.tsx', content, 'utf-8');
