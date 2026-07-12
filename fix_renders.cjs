const fs = require('fs');

let content = fs.readFileSync('src/components/MathFunctionSection.tsx', 'utf-8');

// systemAnswer already done

// aiStudyResult (1388)
content = content.replace(
  /<div className="text-xs sm:text-sm text-slate-100 whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto pl-1 text-right font-sans shadow-sm" style={{ direction: "rtl" }}>\s*\{aiStudyResult\}\s*<\/div>/g,
  `<div className="text-xs sm:text-sm text-slate-100 leading-relaxed max-h-80 overflow-y-auto pl-1 text-right font-sans shadow-sm prose prose-sm max-w-none prose-invert prose-p:leading-relaxed markdown-body" style={{ direction: "rtl" }}>
                    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{aiStudyResult}</Markdown>
                  </div>`
);

// aiStudyResult (2148)
content = content.replace(
  /<div className="text-xs sm:text-sm text-slate-100 whitespace-pre-line leading-relaxed max-h-80 overflow-y-auto pl-1">\s*\{aiStudyResult\}\s*<\/div>/g,
  `<div className="text-xs sm:text-sm text-slate-100 leading-relaxed max-h-80 overflow-y-auto pl-1 prose prose-sm max-w-none prose-invert prose-p:leading-relaxed markdown-body" style={{ direction: "rtl" }}>
                    <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{aiStudyResult}</Markdown>
                  </div>`
);

// mStudyResult
content = content.replace(
  /<div className="text-xs sm:text-sm leading-relaxed max-h-72 overflow-y-auto pl-1 whitespace-pre-wrap font-bold">\s*\{mStudyResult\}\s*<\/div>/g,
  `<div className="text-xs sm:text-sm leading-relaxed max-h-72 overflow-y-auto pl-1 font-bold prose prose-sm max-w-none prose-invert prose-p:leading-relaxed markdown-body" style={{ direction: "rtl" }}>
                  <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{mStudyResult}</Markdown>
                </div>`
);

// limitExplanation
content = content.replace(
  /<p className="text-xs sm:text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">\s*\{limitExplanation\}\s*<\/p>/g,
  `<div className="text-xs sm:text-sm text-slate-100 leading-relaxed prose prose-sm max-w-none prose-invert prose-p:leading-relaxed markdown-body" style={{ direction: "rtl" }}>
                      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{limitExplanation}</Markdown>
                    </div>`
);

// derivExplanation
content = content.replace(
  /<p className="text-xs sm:text-sm text-slate-100 whitespace-pre-wrap leading-relaxed">\s*\{derivExplanation\}\s*<\/p>/g,
  `<div className="text-xs sm:text-sm text-slate-100 leading-relaxed prose prose-sm max-w-none prose-invert prose-p:leading-relaxed markdown-body" style={{ direction: "rtl" }}>
                      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{derivExplanation}</Markdown>
                    </div>`
);

// msg.text
content = content.replace(
  /                                \{msg\.text\}\n                              <\/div>/g,
  `                                <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{msg.text}</Markdown>\n                              </div>`
);

// turn.text
content = content.replace(
  /                      \{turn\.text\}\n                    <\/div>/g,
  `                      <Markdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{turn.text}</Markdown>\n                    </div>`
);

fs.writeFileSync('src/components/MathFunctionSection.tsx', content, 'utf-8');
console.log("Done");
