// One-off secret scanner: scans all git-tracked files for common secret patterns.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const patterns = [
  { name: 'Postgres URL with credentials', re: /postgres(?:ql)?:\/\/[^\s"']+:[^\s"'@]+@/gi },
  { name: 'Generic URL with embedded password', re: /\w+:\/\/[^\s"'\/]+:[^\s"'@]{6,}@/g },
  { name: 'AWS access key', re: /AKIA[0-9A-Z]{16}/g },
  { name: 'Google API key', re: /AIza[0-9A-Za-z_-]{35}/g },
  { name: 'GitHub token', re: /gh[pousr]_[A-Za-z0-9]{36,}/g },
  { name: 'Stripe key', re: /sk_(?:live|test)_[A-Za-z0-9]+/g },
  { name: 'Slack token', re: /xox[baprs]-[A-Za-z0-9-]+/g },
  { name: 'JWT secret assignment', re: /JWT_SECRET\s*=\s*["']?[^"'\s$][^"']{8,}/gi },
  { name: 'WalletConnect project id', re: /WALLETCONNECT_PROJECT_ID\s*=\s*[0-9a-f]{32}/gi },
];

let files;
try {
  files = execSync('git ls-files -z', { cwd: __dirname }).toString().split('\0').filter(Boolean);
} catch (e) {
  console.error('Not a git repo or git unavailable:', e.message);
  process.exit(1);
}

const findings = [];
for (const file of files) {
  const full = path.join(__dirname, file);
  let content;
  try {
    if (fs.statSync(full).size > 2 * 1024 * 1024) continue; // skip huge files
    content = fs.readFileSync(full, 'utf8');
  } catch (_) { continue; }
  for (const { name, re } of patterns) {
    let m;
    while ((m = re.exec(content)) !== null) {
      const lineNo = content.slice(0, m.index).split(String.fromCharCode(10)).length;
      findings.push({ file, line: lineNo, type: name, match: m[0].slice(0, 80) });
    }
  }
}

if (findings.length === 0) {
  console.log('NO FINDINGS');
} else {
  for (const f of findings) {
    console.log(`${f.type} | ${f.file}:${f.line} | ${f.match}`);
  }
}