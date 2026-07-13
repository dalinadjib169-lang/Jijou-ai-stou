const fs = require('fs');
let server = fs.readFileSync('server.ts', 'utf-8');

// Global key usage stats
const statsCode = `
// Global key usage tracking (in-memory)
let keyUsageStats: Record<string, { requests: number; errors: number; lastUsed: Date | null }> = {};
`;
server = server.replace(/async function getSettingsData/g, statsCode + "\nasync function getSettingsData");

// Patch getRotatedApiKeys
server = server.replace(
  /async function getRotatedApiKeys\(\): Promise<string\[\]> \{[\s\S]*?return Array\.from\(new Set\(candidateKeys\)\)\.filter\(Boolean\);\n\}/,
  `async function getRotatedApiKeys(): Promise<string[]> {
  const candidateKeys: string[] = [];
  try {
    for (const [key, value] of Object.entries(process.env)) {
      if (value && typeof value === "string") {
        const trimmed = value.trim();
        if (trimmed.startsWith("AIzaSy") && !trimmed.includes(".") && !trimmed.includes("...") && !trimmed.includes("…")) {
          candidateKeys.push(trimmed);
        }
      }
    }
  } catch (e) {
    console.warn("Error scanning process.env keys:", e);
  }

  const defaultKey = (process.env.GEMINI_API_KEY || "").trim();
  if (defaultKey && defaultKey.startsWith("AIzaSy") && !defaultKey.includes(".") && !defaultKey.includes("...") && !defaultKey.includes("…") && !candidateKeys.includes(defaultKey)) {
    candidateKeys.push(defaultKey);
  }

  const result = Array.from(new Set(candidateKeys)).filter(Boolean);
  
  // Initialize stats for new keys
  result.forEach(k => {
    if (!keyUsageStats[k]) {
      keyUsageStats[k] = { requests: 0, errors: 0, lastUsed: null };
    }
  });
  
  return result;
}`
);

// Patch API key success/fail tracking inside callGeminiAPI / generateContent fallback loop
server = server.replace(
  /let replyText = "";/g,
  `let replyText = "";\n    let successKey = "";`
);

server = server.replace(
  /replyText = response\.text;\n\s*break;/g,
  `replyText = response.text;\n        successKey = activeKey;\n        break;`
);

server = server.replace(
  /let lastError: any = null;/g,
  `let lastError: any = null;`
);

// Instead of manually hacking the inside of the loop (it's complex due to fallback logic), let's just add it where it succeeds and fails.
// Let's write a script that does string manipulation carefully.
