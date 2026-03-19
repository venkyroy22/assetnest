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

  // Fix buttons & backgrounds
  content = content.replace(/bg-emerald-500/g, 'bg-white text-black');
  
  // Since bg-white text-black might duplicate text-black if it already exists:
  // Instead, carefully map:
  content = content.replace(/bg-emerald-500\b/g, 'bg-white');
  content = content.replace(/hover:bg-emerald-400\b/g, 'hover:bg-zinc-200');
  
  // Text colors
  content = content.replace(/text-emerald-400\b/g, 'text-zinc-100');
  content = content.replace(/text-emerald-500\b/g, 'text-white');
  
  // Shadows
  content = content.replace(/shadow-emerald-500\/([0-9]+)/g, 'shadow-white/$1');
  
  // Borders & alphas
  content = content.replace(/border-emerald-500\/([0-9]+)/g, 'border-white/20');
  content = content.replace(/bg-emerald-500\/([0-9]+)/g, 'bg-white/5');
  
  // Specific classes
  content = content.replace(/gradient-text-emerald/g, 'gradient-text-silver');
  content = content.replace(/glow-border-emerald/g, 'glow-border-white');
  
  // Hex color codes mapping to white / light gray
  content = content.replace(/#10b981/g, '#e4e4e7'); // zinc-200

  // The custom orb in page.tsx that had rgba(16,185,129,0.22)
  content = content.replace(/rgba\(16,185,129,0.22\)/g, 'rgba(255,255,255,0.12)');
  content = content.replace(/rgba\(16,185,129,0.18\)/g, 'rgba(255,255,255,0.08)');

  fs.writeFileSync(file, content);
});

console.log("Replaced emerald theme successfully.");
