const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

const newRule2 = `2. التلوين والتأطير (هام جداً): اجعل شروحاتك جذابة ومنظمة. يمنع منعاً باتاً استخدام style="color:..." لأنها تختفي في الوضع المضيء. استخدم فقط وسوم HTML مع كلاسات Tailwind التالية: للون الأخضر <span class="text-emerald-600 dark:text-emerald-400">، البرتقالي <span class="text-amber-600 dark:text-amber-400">، الأزرق <span class="text-blue-600 dark:text-blue-400">، الأحمر <span class="text-red-600 dark:text-red-400">. للتسطير استخدم <u>. للتأطير الملون للمعلومات المهمة استخدم <div class="p-4 my-3 border-2 border-emerald-500 rounded-xl bg-emerald-500/10">.`;

const newRule8 = `8. تلوين الرموز العلمية: استخدم الكلاسات للرموز (مثال: <strong class="text-emerald-600 dark:text-emerald-400">f(x)</strong>، أو <strong class="text-amber-600 dark:text-amber-400">x</strong> بالبرتقالي).`;

content = content.replace(/2\. الشرح الملون والمنظم.*?\n/, newRule2 + '\n');
content = content.replace(/8\. تلوين الرموز العلمية.*?\n/, newRule8 + '\n');

fs.writeFileSync('server.ts', content, 'utf-8');
console.log("Done");
