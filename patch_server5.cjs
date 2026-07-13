const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf-8');

server = server.replace(
  /const mode = keyRotationMode !== undefined \? keyRotationMode : docMode;/g,
  `const mode = "sequential";`
);

fs.writeFileSync('server.ts', server, 'utf-8');
console.log("Server mode patched");
