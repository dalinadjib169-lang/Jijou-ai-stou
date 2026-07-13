const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace(
  /bootstrap\(\);\n?$/g,
  `if (process.env.VERCEL) {
  // In Vercel, we don't start the listener, Vercel handles it via export
} else {
  bootstrap();
}

export default app;
`
);

fs.writeFileSync('server.ts', content, 'utf-8');
console.log("Vercel export added");
