const fs = require('fs');
const t = fs.readFileSync('backend/lib/caja_mp.mjs', 'utf8');
const newline = "const unesc = (v) => String(v).replace(/&/g, '&').replace(/"/g, '\"').replace(/'/g, \"'\").replace(/</g, '<').replace(/>/g, '>');";
const fixed = t.replace(/const unesc = \(v\) => String\(v\)\.replace\(\/&\/g, '&'\)\.replace\(\/"\/g, '"'\)\.replace\(\/'\/g, "'"\)\.replace\(\/<\//g, '<'\)\.replace\(\/>/g, '>'\);/, newline);
fs.writeFileSync('backend/lib/caja_mp.mjs', fixed);
console.log('done');
console.log('newline:', newline);