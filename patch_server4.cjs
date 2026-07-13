const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf-8');

// Ensure keyUsageStats exists
if (!server.includes('keyUsageStats')) {
  server = server.replace(/async function getSettingsData/, `
let keyUsageStats: Record<string, { requests: number; errors: number; lastUsed: Date | null }> = {};
async function getSettingsData`);
}

// Add API endpoint for key status
const apiEndpoint = `
app.get("/api/admin/keys-status", async (req: any, res: any) => {
  try {
    const keys = await getRotatedApiKeys();
    const stats = keys.map(k => {
      const s = keyUsageStats[k] || { requests: 0, errors: 0, lastUsed: null };
      return {
        keyId: k.substring(0, 8) + "..." + k.substring(k.length - 4),
        requests: s.requests,
        errors: s.errors,
        lastUsed: s.lastUsed
      };
    });
    res.json({ keys: stats });
  } catch (e) {
    res.status(500).json({ error: "فشل استرجاع حالة المفاتيح" });
  }
});
`;

if (!server.includes('/api/admin/keys-status')) {
  server = server.replace(/app\.get\("\/api\/admin\/get-settings"/, apiEndpoint + '\napp.get("/api/admin/get-settings"');
}

// Patch the try-catch loop inside chat post
server = server.replace(
  /const ai = new GoogleGenAI\(\{/g,
  `if (keyUsageStats[activeKey]) {
          keyUsageStats[activeKey].requests++;
          keyUsageStats[activeKey].lastUsed = new Date();
        }
        const ai = new GoogleGenAI({`
);

server = server.replace(
  /lastError = error;\n\s*console\.error/g,
  `lastError = error;
        if (keyUsageStats[activeKey]) {
          keyUsageStats[activeKey].errors++;
        }
        console.error`
);

fs.writeFileSync('server.ts', server, 'utf-8');
console.log("Stats added");
