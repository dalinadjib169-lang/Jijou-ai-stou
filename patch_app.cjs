const fs = require('fs');
let content = fs.readFileSync('src/App.tsx', 'utf-8');

content = content.replace(/apiKeys=\{apiKeys\}/g, '');
content = content.replace(/setApiKeys=\{setApiKeys\}/g, '');
content = content.replace(/keyRotationMode=\{keyRotationMode\}/g, '');
content = content.replace(/setKeyRotationMode=\{setKeyRotationMode\}/g, '');
content = content.replace(/selectedKeyIndex=\{selectedKeyIndex\}/g, '');
content = content.replace(/setSelectedKeyIndex=\{setSelectedKeyIndex\}/g, '');

// Clean up unused state variables from App.tsx
content = content.replace(/const \[apiKeys, setApiKeys\] = useState[\s\S]*?\}\);\n/g, '');
content = content.replace(/const \[keyRotationMode, setKeyRotationMode\] = useState[\s\S]*?\}\);\n/g, '');
content = content.replace(/const \[selectedKeyIndex, setSelectedKeyIndex\] = useState[\s\S]*?\}\);\n/g, '');

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log("App.tsx cleaned up");
