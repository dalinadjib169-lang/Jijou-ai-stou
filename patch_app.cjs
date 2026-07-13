const fs = require('fs');
let app = fs.readFileSync('src/App.tsx', 'utf-8');

app = app.replace(
  /const \[activationCode, setActivationCode\] = useState\(""\);\n  const \[isActivating, setIsActivating\] = useState\(false\);\n  const \[activationError, setActivationError\] = useState\(""\);/,
  `const [isWatchingAd, setIsWatchingAd] = useState(false);`
);

app = app.replace(
  /const handleActivateCode = async \(\) => {[\s\S]*?};/,
  `const handleWatchAd = () => {
    setIsWatchingAd(true);
    // Mock AdMob integration
    setTimeout(() => {
      const addedPoints = 5;
      const newPoints = premiumPoints + addedPoints;
      setPremiumPoints(newPoints);
      localStorage.setItem("dali_premiumPoints", String(newPoints));
      setShowPointsModal(false);
      setIsWatchingAd(false);
      alert("تمت إضافة 5 أسئلة بنجاح!");
    }, 2000);
  };`
);

app = app.replace(
  /<h3 className=\{`text-xl font-bold mb-2 flex items-center gap-2 \$\{isDarkMode \? 'text-white' : 'text-slate-800'\}`\}>\s*<Key className="w-5 h-5 text-emerald-500" \/>\s*شحن الرصيد المميز\s*<\/h3>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/,
  `<h3 className={\`text-xl font-bold mb-2 flex items-center gap-2 \${isDarkMode ? 'text-white' : 'text-slate-800'}\`}>
              <Key className="w-5 h-5 text-emerald-500" />
              الأسئلة المجانية انتهت
            </h3>
            
            <p className={\`text-sm mb-6 leading-relaxed \${isDarkMode ? 'text-slate-300' : 'text-slate-600'}\`}>
              لقد استهلكت جميع أسئلتك المجانية الـ 10. لتتمكن من مواصلة استخدام الأستاذ دالي والحصول على 5 أسئلة إضافية، يرجى مشاهدة إعلان قصير.
            </p>
            
            <div className="space-y-4">
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowPointsModal(false)}
                  className={\`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all \${isDarkMode ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}\`}
                >
                  إلغاء
                </button>
                <button 
                  onClick={handleWatchAd}
                  disabled={isWatchingAd}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isWatchingAd ? 'جاري التحميل...' : 'شاهد إعلان للحصول على أسئلة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}`
);

fs.writeFileSync('src/App.tsx', app, 'utf-8');
console.log("App patched for AdMob mockup");
