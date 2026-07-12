const fs = require('fs');
let content = fs.readFileSync('src/components/ChatSection.tsx', 'utf-8');
content = content.replace(
  /prose-p:leading-relaxed markdown-body text-right\`\}>/g,
  'prose-p:leading-relaxed markdown-body text-right`} style={{ direction: "rtl" }}>'
);
fs.writeFileSync('src/components/ChatSection.tsx', content, 'utf-8');
console.log("Chat dir fixed");
