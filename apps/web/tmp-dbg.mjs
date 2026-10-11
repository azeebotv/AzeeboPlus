import fs from 'node:fs';
let s = fs.readFileSync(process.argv[2], 'utf8');
const steps = [
  ['p', /<p[^>]*>[\s\S]*?<\/p>/g],
  ['cls', /className="[^"]*"/g],
  ['style', /style=\{\{[^}]*\}\}/g],
  ['uc', /'use client';?/g],
  ['imp', /import[^;]+;/g],
  ['sig', /export default function \w+\([^)]*\)(:\s*[^{]+)?/],
  ['pipe', /<\/?(div|span|h\d)>/g],
  ['brace', /\{[^{}]*\}/g],
  ['tags', /<[^>]*>/g],
];
for (const [n, re] of steps) {
  s = s.replace(re, '|');
  console.log(`--- after ${n} ---\n${JSON.stringify(s)}`);
}
