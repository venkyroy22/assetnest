const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components', 'lib', 'data'];
const extensions = ['.tsx', '.ts', '.js', '.jsx'];

function processDir(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
                processDir(fullPath);
            }
        } else if (extensions.includes(path.extname(file))) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let changed = false;
            
            // 1. Literal "emerald" anywhere in a class-like string
            // We'll look for "emerald" and replace the whole class segment with "white" or "zinc-X"
            // But let's be careful.
            
            const emeraldRegex = /([a-z0-9-]*)-emerald-([0-9]+)(\/[0-9]+)?/g;
            if (emeraldRegex.test(content)) {
                content = content.replace(emeraldRegex, (match, prefix, num, opacity) => {
                    const fallbackOpacity = opacity || "";
                    // If it's a border-t, border-b, etc.
                    if (prefix.startsWith('border')) return `border-t-white${fallbackOpacity}`; // simplified
                    if (prefix.startsWith('text')) return `text-white${fallbackOpacity}`;
                    if (prefix.startsWith('bg')) return `bg-white${fallbackOpacity}`;
                    return `white${fallbackOpacity}`; // fallback
                });
                changed = true;
            }

            // More general replacement for anything containing "emerald" in a className
            if (content.includes("emerald")) {
                // border-t-emerald-500 -> border-t-white
                content = content.replace(/border-([a-z]-)?emerald-([0-9]+)/g, "border-$1white");
                content = content.replace(/text-emerald-([0-9]+)/g, "text-white");
                content = content.replace(/bg-emerald-([0-9]+)/g, "bg-white");
                content = content.replace(/fill-emerald-([0-9]+)/g, "fill-white");
                content = content.replace(/stroke-emerald-([0-9]+)/g, "stroke-white");
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log(`Aggressively removed emerald from: ${fullPath}`);
            }
        }
    });
}

targetDirs.forEach(dir => {
    const dirPath = path.resolve(__dirname, dir);
    processDir(dirPath);
});
console.log("Aggressive Emerald removal complete.");
