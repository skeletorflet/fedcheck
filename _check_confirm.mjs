import fs from 'node:fs';
const t = fs.readFileSync('_exploracion/mp_full_confirm.html', 'utf8');
const txt = t.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const i = txt.indexOf('var ingreso');
console.log(txt.slice(i - 100, i + 300));