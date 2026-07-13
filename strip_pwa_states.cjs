const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// Remove PWA status tracking
content = content.replace(
  /const \[showPwaHelpModal, setShowPwaHelpModal\] = useState\(false\);\n?\s*\/\/ High Fidelity PWA status tracking[\s\S]*?return isStandalone \|\| localInstalled;\n\s*\}\);\n?/g,
  ''
);

// Remove the useEffect for PWA standalone installation status
content = content.replace(
  /\/\/ Native and media listeners to detect PWA standalone installation status[\s\S]*?window\.removeEventListener\('beforeinstallprompt', handleBeforeInstallPrompt\);\n\s*};\n\s*\}, \[\]\);\n?/g,
  ''
);

content = content.replace(
  /const handleInstallPWA = \(\) => \{[\s\S]*?\}\n?\n/g,
  ''
);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("PWA states removed");
