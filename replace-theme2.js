const fs = require('fs');

const files = [
  'app/page.tsx',
  'components/Navbar.tsx',
  'components/Footer.tsx',
  'components/HomeToolsGrid.tsx',
  'app/globals.css'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Replace any remaining 'emerald' occurrences
  content = content.replace(/emerald/ig, 'white');
  
  // Replace the specific hex code for emerald 
  content = content.replace(/#10b981/ig, '#e4e4e7');

  // Cleanup potential weird classes caused by generic replacement
  content = content.replace(/white-500/g, 'zinc-300'); // if it was emerald-500
  content = content.replace(/white-400/g, 'zinc-200'); // if it was emerald-400

  fs.writeFileSync(file, content);
});

console.log("Replaced remaining emerald theme successfully.");
