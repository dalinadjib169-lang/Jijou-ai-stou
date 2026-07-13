const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Replace the main condition block
content = content.replace(
  /\{activeTab !== "admin" && !isAppInstalled \? \([\s\S]*?\) : \(\s*<>\s*(\{activeTab === "chat"[\s\S]*?)\s*<\/>\s*\)\}/,
  '$1'
);

// Remove the install button in header
content = content.replace(
  /\{!isAppInstalled && \([\s\S]*?title="تثبيت التطبيق على جهازك كـ تطبيق أندرويد"[\s\S]*?<\/button>\s*\)\}/,
  ''
);

// Remove the prominent installation banner
content = content.replace(
  /\{\/\* Prominent High-Conversion Android\/PWA Installation Banner \*\/\}[\s\S]*?\{!isAppInstalled && \([\s\S]*?<\/div>\s*\)\}/,
  ''
);

// Remove PWA help modal rendering
content = content.replace(
  /\{showPwaHelpModal && \([\s\S]*?z-50[\s\S]*?<\/div>\s*\)\}/,
  ''
);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("PWA blocks removed");
