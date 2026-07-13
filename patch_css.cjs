const fs = require('fs');
let css = fs.readFileSync('src/index.css', 'utf-8');

css += `\n/* Fix horizontal overflow in markdown */\n.markdown-body {\n  word-wrap: break-word;\n  word-break: break-word;\n  overflow-wrap: break-word;\n  max-width: 100%;\n  overflow-x: hidden;\n}\n`;

fs.writeFileSync('src/index.css', css, 'utf-8');
console.log("CSS patched");
