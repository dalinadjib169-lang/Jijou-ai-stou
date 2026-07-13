const fs = require('fs');

let content = fs.readFileSync('src/App.tsx', 'utf-8');
const lines = content.split('\n');

const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  if (line.includes('// PWA standalone installation states')) skip = true;
  if (line.includes('// 2. Hear and capture browser beforeinstallprompt')) skip = true;
  if (line.includes('const handleInstallPWA =')) skip = true;
  if (line.includes('{/* Direct PWA Install Button')) skip = true;
  if (line.includes('{/* PWA Direct Installation Guidance Modal */}')) skip = true;
  
  if (!skip) {
    if (!line.includes('onClick={handleInstallPWA}') && !line.includes('تثبيت التطبيق على جهازك كـ تطبيق أندرويد')) {
      newLines.push(line);
    }
  }

  // End skip conditions
  if (skip) {
    if (line.includes('window.removeEventListener(\'appinstalled\'')) {
      // Need to skip until the end of this effect
      let j = i;
      while (!lines[j].includes('}, []);')) j++;
      i = j;
      skip = false;
    }
    else if (line.includes('window.removeEventListener(\'beforeinstallprompt\'')) {
      let j = i;
      while (!lines[j].includes('}, []);')) j++;
      i = j;
      skip = false;
    }
    else if (line.includes('const handleInstallPWA =')) {
      let j = i;
      while (!lines[j].includes('  };')) j++;
      i = j;
      skip = false;
    }
    else if (line.includes('{!isAppInstalled && (')) {
      let j = i;
      while (!lines[j].includes(')}')) j++;
      i = j;
      skip = false;
    }
    else if (line.includes('{showPwaHelpModal && (')) {
      let j = i;
      while (!lines[j].includes(')}')) j++;
      i = j;
      skip = false;
    }
  }
}

fs.writeFileSync('src/App.tsx', newLines.join('\n'), 'utf-8');
console.log("Wiped PWA lines");
