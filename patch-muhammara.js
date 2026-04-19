const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'node_modules', 'muhammara', 'package.json');

if (fs.existsSync(pkgPath)) {
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    if (pkg.binary) {
      delete pkg.binary;
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
      console.log('Successfully removed binary field from muhammara/package.json to fix Turbopack build');
    } else {
      console.log('muhammara/package.json already has no binary field.');
    }
  } catch (err) {
    console.error('Error patching muhammara:', err);
  }
} else {
  console.log('muhammara package.json not found, skipping patch.');
}
