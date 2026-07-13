const fs = require('fs');

let server = fs.readFileSync('server.ts', 'utf-8');
const oldRule8 = /8\. تلوين الرموز العلمية.*?\n/;
const newRule8 = `8. التنسيق والألوان الاحترافية:
   - اجعل الكلمات الهامة جداً بخط غامق (Bold).
   - استخدم العناوين (H3) مع أيقونة مناسبة (مثال: 💡 نصيحة، ✅ الحل، ⚠️ ملاحظة، 📌 الخطوات).
   - اكتب الخطوات في قائمة نقطية لتظهر كبطاقات منسقة.
   - لتلوين النص، يمكنك استخدام الكلاسات: <span class="text-success">نجاح</span>، <span class="text-info">معلومات</span>، <span class="text-warning">تحذير</span>، <span class="text-error">خطأ</span>.
   - لا تترك فراغات كبيرة جداً، بل نسّق إجابتك لتكون متصلة وواضحة وسهلة القراءة على شاشة الهاتف.\n`;

server = server.replace(oldRule8, newRule8);
fs.writeFileSync('server.ts', server, 'utf-8');
console.log("Updated prompt for colors");
