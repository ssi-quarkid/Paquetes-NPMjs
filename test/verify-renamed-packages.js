const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === 'lib' || entry.name === 'test') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, callback);
    } else {
      callback(full);
    }
  }
}

const root = path.resolve(__dirname, '..');
const extrimianFiles = [];
let quarkidFound = false;
walk(root, (file) => {
  if (file.endsWith('yarn.lock')) return;
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('@extrimian')) {
    extrimianFiles.push(file);
  }
  if (content.includes('@quarkid')) {
    quarkidFound = true;
  }
});

if (extrimianFiles.length > 0) {
  console.error('Found @extrimian references in files:\n' + extrimianFiles.join('\n'));
  process.exit(1);
}

if (!quarkidFound) {
  console.error('No @quarkid references found.');
  process.exit(1);
}

// verify each package.json name
function checkPackageNames(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const pkgPath = path.join(full, 'package.json');
      if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        if (!pkg.name || !pkg.name.startsWith('@quarkid/')) {
          console.error('Package without @quarkid scope:', pkgPath);
          process.exit(1);
        }
      }
      checkPackageNames(full);
    }
  }
}

checkPackageNames(path.join(root, 'packages'));

console.log('All packages use @quarkid scope and no @extrimian references remain.');
