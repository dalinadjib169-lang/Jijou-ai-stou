const fs = require('fs');

let css = fs.readFileSync('src/index.css', 'utf-8');
if (!css.includes('.markdown-body p')) {
  css += `
/* Fix RTL List and Block direction */
.markdown-body {
  direction: rtl;
  text-align: right;
}
.markdown-body ul, .markdown-body ol {
  padding-right: 1.5rem;
  padding-left: 0;
}
.markdown-body li {
  direction: rtl;
}
`;
  fs.writeFileSync('src/index.css', css, 'utf-8');
}
console.log("CSS updated");
