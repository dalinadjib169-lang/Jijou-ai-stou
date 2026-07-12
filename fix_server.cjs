const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf-8');
server = server.replace(
  /ككود برمجي، مثال: \`f\(x\) = 2x \+ 1\` أو \`x1 = \(-b - √Δ\) \/ 2a\`\./g,
  'ككود برمجي لتظهر كالتالي (مثال): f(x) = 2x + 1 داخل الرموز البرمجية.'
);
fs.writeFileSync('server.ts', server, 'utf-8');
console.log("Fixed server template literal issue");
