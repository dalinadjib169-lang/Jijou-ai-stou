const fs = require('fs');
let chat = fs.readFileSync('src/components/ChatSection.tsx', 'utf-8');

chat = chat.replace(
  /className="flex items-center gap-2"/g,
  'className="flex items-center gap-2 w-full"'
);

chat = chat.replace(
  /placeholder="اسأل الأستاذ دالي عن أي دالة، مبرهنة، أو تمرين..."/g,
  'placeholder="اسأل الأستاذ دالي هنا..."'
);

chat = chat.replace(
  /className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500/g,
  'className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm md:text-base text-white placeholder-slate-500'
);

chat = chat.replace(
  /prose prose-sm max-w-none/g,
  'prose prose-sm max-w-full overflow-hidden break-words'
);

fs.writeFileSync('src/components/ChatSection.tsx', chat, 'utf-8');
console.log("ChatSection input and markdown patched");
