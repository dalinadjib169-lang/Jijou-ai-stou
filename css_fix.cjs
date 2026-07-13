const fs = require('fs');

let content = fs.readFileSync('src/index.css', 'utf-8');

const additionalStyles = `
/* Advanced AI Chat UI Styling */

.markdown-body {
  font-family: "Inter", "Cairo", "Tajawal", system-ui, sans-serif !important;
  font-size: 17px !important;
  line-height: 1.5 !important;
  font-weight: 600 !important;
  text-align: right;
  direction: rtl;
}

@media (min-width: 768px) {
  .markdown-body {
    font-size: 18px !important;
  }
}

.markdown-body p {
  margin-top: 0.5rem !important;
  margin-bottom: 0.5rem !important;
  line-height: 1.5 !important;
}

.markdown-body strong {
  font-weight: 800 !important;
  color: inherit;
}

.markdown-body h1, .markdown-body h2, .markdown-body h3, .markdown-body h4 {
  margin-top: 1rem !important;
  margin-bottom: 0.5rem !important;
  font-weight: 800 !important;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  line-height: 1.4 !important;
}

.markdown-body h1, .markdown-body h2 {
  color: #10b981 !important; /* Emerald */
}

.markdown-body h3, .markdown-body h4 {
  color: #3b82f6 !important; /* Blue */
}

/* Steps and Lists styling as cards */
.markdown-body ul, .markdown-body ol {
  padding: 0 !important;
  margin: 0.75rem 0 !important;
  list-style: none !important;
}

.markdown-body li {
  background-color: rgba(16, 185, 129, 0.05);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 12px;
  padding: 12px 16px;
  margin-bottom: 8px;
  position: relative;
  font-weight: 600;
  line-height: 1.5;
}

.light-theme-wrapper .markdown-body li {
  background-color: rgba(5, 150, 105, 0.05);
  border-color: rgba(5, 150, 105, 0.2);
}

.markdown-body li::before {
  content: "•";
  color: #10b981;
  font-weight: bold;
  position: absolute;
  right: 12px; /* RTL */
  display: none;
}

.markdown-body code {
  direction: ltr !important;
  unicode-bidi: embed;
  display: inline-block;
  text-align: left;
  background: rgba(15, 23, 42, 0.4) !important;
  padding: 2px 6px !important;
  border-radius: 6px !important;
  font-weight: 700 !important;
}

.light-theme-wrapper .markdown-body code {
  background: rgba(241, 245, 249, 0.8) !important;
}

.markdown-body pre {
  margin: 0.75rem 0 !important;
  border-radius: 12px !important;
}

/* Custom coloring elements via generic classes or text */
.text-success { color: #10b981 !important; }
.text-info { color: #3b82f6 !important; }
.text-warning { color: #f59e0b !important; }
.text-error { color: #ef4444 !important; }

/* AI bubble max-width fix */
.ai-bubble {
  width: 95% !important;
  max-width: 95% !important;
}

.user-bubble {
  max-width: 90% !important;
}
`;

content += additionalStyles;
fs.writeFileSync('src/index.css', content, 'utf-8');
console.log("CSS updated");
