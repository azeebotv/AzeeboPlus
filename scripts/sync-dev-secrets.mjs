import fs from 'fs';
import path from 'path';

// Read root secrets from .env and .env.local
function loadRootSecrets() {
  const secrets = {};
  for (const file of ['.env', '.env.local']) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const match = trimmed.match(/^([A-Za-z0-9_]+)=(.*)$/);
        if (match) {
          let val = match[2].trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          secrets[match[1]] = val;
        }
      }
    }
  }
  return secrets;
}

const rootSecrets = loadRootSecrets();
console.log('Canonical local development secrets:');
const syncKeys = ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET', 'GATEWAY_SECRET', 'INTERNAL_API_KEY'];
for (const key of syncKeys) {
  console.log(`  ${key}=${rootSecrets[key] ? rootSecrets[key].substring(0, 10) + '...' : '<MISSING>'}`);
}

function findEnvFiles(dir) {
  let list = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.next') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      list = list.concat(findEnvFiles(fullPath));
    } else if (entry.isFile() && entry.name === '.env') {
      list.push(fullPath);
    }
  }
  return list;
}

const serviceEnvFiles = findEnvFiles('services').sort();
if (fs.existsSync('apps/admin/.env')) {
  serviceEnvFiles.push('apps/admin/.env');
}

console.log(`\nFound ${serviceEnvFiles.length} target .env files.\n`);

let updatedCount = 0;

for (const envPath of serviceEnvFiles) {
  let content = fs.readFileSync(envPath, 'utf8');
  let changed = false;

  for (const key of syncKeys) {
    const canonicalVal = rootSecrets[key];
    if (!canonicalVal) continue;

    const regex = new RegExp(`^([\\t ]*${key}[\\t ]*=[\\t ]*)(.*)$`, 'm');
    const match = content.match(regex);

    if (match) {
      let currentVal = match[2].trim();
      if ((currentVal.startsWith('"') && currentVal.endsWith('"')) || (currentVal.startsWith("'") && currentVal.endsWith("'"))) {
        currentVal = currentVal.slice(1, -1);
      }
      if (currentVal !== canonicalVal) {
        content = content.replace(regex, `${key}=${canonicalVal}`);
        changed = true;
        console.log(`  [UPDATE] ${envPath}: ${key}`);
      }
    } else {
      // Append missing key
      content = content.trimEnd() + `\n${key}=${canonicalVal}\n`;
      changed = true;
      console.log(`  [APPEND] ${envPath}: ${key}`);
    }
  }

  if (changed) {
    fs.writeFileSync(envPath, content, 'utf8');
    updatedCount++;
  }
}

console.log(`\nDone. Synchronized ${updatedCount} file(s).`);
