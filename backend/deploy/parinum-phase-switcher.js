const fs = require('fs');
const { execSync } = require('child_process');

const envPath = '/opt/parinum-profile-indexer/.env';
const healthUrl = 'http://127.0.0.1:4100/healthz';
const lagThreshold = 20000;

function parseEnv(text) {
  const map = new Map();
  for (const line of text.split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const i = line.indexOf('=');
    if (i === -1) continue;
    map.set(line.slice(0, i), line.slice(i + 1));
  }
  return map;
}

function writeEnv(original, updates) {
  const lines = original.split(/\r?\n/).filter(Boolean);
  const out = [];
  const seen = new Set();
  for (const line of lines) {
    const i = line.indexOf('=');
    if (i === -1) {
      out.push(line);
      continue;
    }
    const k = line.slice(0, i);
    if (updates.has(k)) {
      out.push(k + '=' + updates.get(k));
      seen.add(k);
    } else {
      out.push(line);
    }
  }
  for (const [k, v] of updates.entries()) {
    if (!seen.has(k)) out.push(k + '=' + v);
  }
  fs.writeFileSync(envPath, out.join('\n') + '\n');
}

function getHealth() {
  try {
    const raw = execSync('curl -sS -m 15 ' + healthUrl, { encoding: 'utf8' });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function restartService() {
  execSync('systemctl restart parinum-profile-indexer', { stdio: 'inherit' });
}

function main() {
  const health = getHealth();
  if (!health) return;
  if (!Array.isArray(health.chains) || health.chains.length !== 1) return;

  const active = health.chains[0];
  const lag = Number(active.lagBlocks ?? 0);
  if (!Number.isFinite(lag) || lag > lagThreshold) return;

  const envText = fs.readFileSync(envPath, 'utf8');
  const env = parseEnv(envText);
  const current = env.get('PROFILE_INDEXER_CHAINS') || '';

  let next = null;
  if (current === '1' && active.chainId === 1) next = '56';
  else if (current === '56' && active.chainId === 56) next = '137';
  else if (current === '137' && active.chainId === 137) next = '1,56,137';
  else return;

  const updates = new Map([
    ['PROFILE_INDEXER_CHAINS', next],
    ['PROFILE_INDEXER_POLL_INTERVAL_MS', '30000'],
    ['PROFILE_INDEXER_BATCH_SIZE', '10'],
    ['PROFILE_INDEXER_BATCH_SIZE_1', '10'],
    ['PROFILE_INDEXER_BATCH_SIZE_56', '10'],
    ['PROFILE_INDEXER_BATCH_SIZE_137', '10'],
  ]);

  writeEnv(envText, updates);
  console.log('Switching phase ' + current + ' -> ' + next + ' (lag ' + lag + ')');
  restartService();
}

try {
  main();
} catch (e) {
  console.error(e);
  process.exit(1);
}
