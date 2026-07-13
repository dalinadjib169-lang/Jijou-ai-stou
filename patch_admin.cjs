const fs = require('fs');

let content = fs.readFileSync('src/components/AdminSection.tsx', 'utf-8');

// The section starts around `{/* 3. API key rotation manager */}`
// And ends at `{/* Codes Generator Section */}`

const newSection = `
            {/* 3. API key rotation manager */}
            <div className="space-y-3">
              <h5 className="text-white font-black text-sm flex items-center justify-end gap-1.5">
                مفاتيح Vercel المفعّلة (Key Rotation)
                <Key className="w-4 h-4 text-emerald-400" />
              </h5>
              
              <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 space-y-4 text-right">
                <p className="text-xs text-slate-400">
                  تتم قراءة مفاتيح API وعملية التدوير تلقائياً من بيئة Vercel. 
                  لا يمكن إضافة أو حذف المفاتيح من هنا.
                </p>

                {keyStats.length === 0 ? (
                  <div className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 text-center">
                    <p className="text-slate-500 font-bold text-xs">جاري جلب المفاتيح...</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80 max-h-48 overflow-y-auto space-y-1">
                    {keyStats.map((stat, index) => (
                      <div key={index} className="flex flex-col p-2.5 rounded-xl text-xs font-mono font-bold transition-all border border-slate-800/60 bg-slate-900/40">
                        <div className="flex justify-between w-full text-slate-300">
                           <span>{stat.keyId}</span>
                           <span className="text-emerald-400">مفتاح #{index + 1}</span>
                        </div>
                        <div className="flex justify-between w-full mt-2 text-[10px] text-slate-500">
                           <span>طلبات: {stat.requests} | أخطاء: {stat.errors}</span>
                           <span>آخر استخدام: {stat.lastUsed ? new Date(stat.lastUsed).toLocaleTimeString('ar-DZ') : 'لم يستخدم بعد'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
`;

content = content.replace(/\{\/\* 3\. API key rotation manager \*\/\}[\s\S]*?(?=\{\/\* Codes Generator Section \*\/})/g, newSection + '\n            ');

// We also need to add state for keyStats and fetch it
if (!content.includes('keyStats')) {
  content = content.replace(/const \[saveSuccess, setSaveSuccess\] = useState\(false\);/, 
    `const [saveSuccess, setSaveSuccess] = useState(false);
  const [keyStats, setKeyStats] = useState<{keyId: string, requests: number, errors: number, lastUsed: string | null}[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      fetch("/api/admin/keys-status")
        .then(res => res.json())
        .then(data => setKeyStats(data.keys || []))
        .catch(err => console.error("Failed to load key stats", err));
    }
  }, [isAuthenticated]);
`
  );
}

// Remove adding/removing logic from AdminSection
content = content.replace(/const \[newKey, setNewKey\] = useState\(""\);\n?/g, '');
content = content.replace(/const addApiKey = \(\) => \{[\s\S]*?\};\n?/g, '');
content = content.replace(/const removeApiKey = \(idx: number\) => \{[\s\S]*?\};\n?/g, '');

fs.writeFileSync('src/components/AdminSection.tsx', content, 'utf-8');
console.log("Admin section updated");
