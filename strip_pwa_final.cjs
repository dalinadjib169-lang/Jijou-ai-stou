const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove PWA standalone installation states
content = content.replace(
  /\s*\/\/ PWA standalone installation states[\s\S]*?const \[isAppInstalled, setIsAppInstalled\] = useState<boolean>[\s\S]*?\);\n/g,
  ''
);

// Remove Native and media listeners
content = content.replace(
  /\s*\/\/ Native and media listeners to detect PWA standalone installation status[\s\S]*?window\.removeEventListener\('appinstalled', handleAppInstalled\);\n\s*};\n\s*\}, \[\]\);\n/g,
  ''
);

// Remove handleUninstallPWA
content = content.replace(
  /\s*const handleUninstallPWA = \(\) => \{[\s\S]*?\}\n/g,
  ''
);

// Remove Hear and capture browser beforeinstallprompt
content = content.replace(
  /\s*\/\/ 2\. Hear and capture browser beforeinstallprompt[\s\S]*?window\.removeEventListener\('beforeinstallprompt', handleBeforeInstallPrompt\);\n\s*};\n\s*\}, \[\]\);\n/g,
  ''
);

// Remove handleInstallPWA
content = content.replace(
  /\s*const handleInstallPWA = async \(\) => \{[\s\S]*?\}\n/g,
  ''
);

// Remove PWA install button in menu
content = content.replace(
  /<button\s*onClick=\{handleInstallPWA\}[\s\S]*?تثبيت التطبيق على جهازك كـ تطبيق أندرويد[\s\S]*?<\/button>\s*/g,
  ''
);

// Remove the direct install button
content = content.replace(
  /\{\/\* Direct PWA Install Button representing the user request \*\/\}[\s\S]*?\{\!isAppInstalled && \([\s\S]*?<\/button>\s*\)\}\s*/g,
  ''
);

// Remove PWA modal
content = content.replace(
  /\{\/\* PWA Direct Installation Guidance Modal \*\/\}[\s\S]*?\{showPwaHelpModal && \([\s\S]*?<\/div>\s*\)\}\s*/g,
  ''
);

// Remove showPwaHelpModal state
content = content.replace(
  /\s*const \[showPwaHelpModal, setShowPwaHelpModal\] = useState\(false\);\n/g,
  ''
);

// Remove isAppInstalled from conditions if any
content = content.replace(/!\s*isAppInstalled/g, 'true');

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("Cleaned PWA");
