const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

// Replace startServer call
content = content.replace(
  /startServer\(\);\n*$/g,
  `if (!process.env.VERCEL) {
  startServer();
}

export default app;
`
);

// We need to make sure 'app' is accessible and exportable
// Wait, 'const app = express()' is inside startServer()!
