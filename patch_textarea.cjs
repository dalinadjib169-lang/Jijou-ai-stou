const fs = require('fs');
let chat = fs.readFileSync('src/components/ChatSection.tsx', 'utf-8');

chat = chat.replace(
  /<input\s+type="text"\s+value=\{inputMsg\}\s+onChange=\{\(e\) => setInputMsg\(e\.target\.value\)\}\s+placeholder="اسأل الأستاذ دالي هنا\.\.\."\s+className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2\.5 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500\/20 transition-all duration-200 text-right"\s+disabled=\{isSending\}\s+\/>/g,
  `<textarea
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            placeholder="اسأل الأستاذ دالي هنا..."
            className="flex-1 min-w-0 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-sm md:text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 text-right resize-none h-14"
            disabled={isSending}
          />`
);

fs.writeFileSync('src/components/ChatSection.tsx', chat, 'utf-8');
console.log("ChatSection changed to textarea");
