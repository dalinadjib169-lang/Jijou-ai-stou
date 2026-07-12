const fs = require('fs');

let content = fs.readFileSync('src/components/ChatSection.tsx', 'utf-8');

// 1. Change max-w-4xl to w-full in the message row
content = content.replace(/className={\`flex gap-3 max-w-4xl \$\{/g, 'className={`flex gap-3 w-full ${');

// 2. Change max-w-[85%] for the message body to be dynamic
content = content.replace(
  /className=\{\`flex flex-col max-w-\[85%\] \$\{/g,
  'className={`flex flex-col ${msg.sender === "user" ? "max-w-[85%]" : "w-full"} ${'
);

// 3. Make sure prose is right-aligned
content = content.replace(
  /prose-p:leading-relaxed markdown-body/g,
  'prose-p:leading-relaxed markdown-body text-right'
);

fs.writeFileSync('src/components/ChatSection.tsx', content, 'utf-8');
console.log("ChatSection fixed");
