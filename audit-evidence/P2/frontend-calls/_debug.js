const fs = require('fs');
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}
function extractUrls(text) {
  const urls = new Set();
  const re = /['"`](https?:\/\/[^'"`]+|\/auth\/[^'"`]+|\/wallet\/[^'"`]+|\/v1\/[^'"`]+|\/v2\/[^'"`]+|\/api\/[^'"`]+|\/users\/[^'"`]+|\/privacy\/[^'"`]+|\/payments\/[^'"`]+|\/admin\/[^'"`]+|\/search\/[^'"`]+|\/content\/[^'"`]+|\/notifications\/[^'"`]+|\/wallet\/transactions|\/wallet\/balance)['"`]/gi;
  let m;
  while ((m = re.exec(text))) urls.add(m[1]);
  return Array.from(urls);
}
function findNamespaceMethods(text, nsName) {
  const re = new RegExp('export\\s+const\\s+' + nsName + '\\s*=\\s*\\{([\\s\\S]*?)\\n\\};', 'm');
  const m = re.exec(text);
  if (!m) return [];
  const body = m[1];
  const methods = [];
  const chunks = body.split(/,\s*\n/);
  for (const ch of chunks) {
    const nameMatch = ch.match(/^\s*([a-zA-Z_]\w*)\s*:\s*async\s*\(/);
    if (nameMatch) {
      const name = nameMatch[1];
      const urls = extractUrls(ch);
      methods.push({ ns: nsName, name, urls, snippet: ch.trim().slice(0, 200) });
    }
  }
  return methods;
}
const src = fs.readFileSync('apps/mobile/src/api/auth.ts', 'utf8');
const stripped = stripComments(src);
const m = findNamespaceMethods(stripped, 'authApi');
console.log('methods found:', m.length);
console.log(JSON.stringify(m, null, 2));