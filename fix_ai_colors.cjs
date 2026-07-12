const fs = require('fs');

let content = fs.readFileSync('server.ts', 'utf-8');

const newRule2 = `2. التلوين والتأطير (هام جداً): اجعل شروحاتك جذابة ومنظمة. يمنع منعاً باتاً استخدام style="color:..." لأنها تختفي. استخدم فقط وسوم HTML مع الكلاسات المخصصة التالية: للون الأخضر الأساسي <span class="color-primary">، البرتقالي <span class="color-secondary">، الأزرق <span class="color-accent">، الأحمر <span class="color-danger">. للتسطير استخدم <u>. للتأطير الملون للمعلومات المهمة استخدم <div class="info-box">.`;

const newRule8 = `8. تلوين الرموز العلمية: استخدم الكلاسات للرموز (مثال: <strong class="color-primary">f(x)</strong>، أو <strong class="color-secondary">x</strong> بالبرتقالي).`;

content = content.replace(/2\. التلوين والتأطير.*?\n/, newRule2 + '\n');
content = content.replace(/8\. تلوين الرموز العلمية.*?\n/, newRule8 + '\n');

fs.writeFileSync('server.ts', content, 'utf-8');
console.log("Done");
