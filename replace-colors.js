const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components', 'lib', 'data'];
const extensions = ['.tsx', '.ts', '.js', '.jsx'];

const accentColorsHex = [
    "#6366f1", "#3b82f6", "#a855f7", "#f59e0b", "#f43f5e", "#ec4899", "#fbbf24", "#818cf8", 
    "#ef4444", "#f97316", "#0d9488", "#d946ef", "#0ea5e9", "#8b5cf6", "#f43f5e", "#f59e0b", "#ef4444"
];

const tailwindPrefixes = [
    "indigo-", "blue-", "purple-", "amber-", "rose-", "pink-", "sky-", "violet-", "orange-", "cyan-", "teal-", "lime-", "yellow-", "fuchsia-", "emerald-500", "emerald-400"
];

// Special case: don't replace emerald with itself in a double replacement, 
// though the logic below handles literal matching.

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
            
            // 1. Replace Hex colors
            accentColorsHex.forEach(hex => {
                const regex = new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                if (regex.test(content)) {
                    content = content.replace(regex, "#10b981");
                    changed = true;
                }
            });

            // 2. Replace Tailwind classes
            tailwindPrefixes.forEach(prefix => {
                // This regex is tricky. We want to find things like text-indigo-500, bg-purple-200/50, etc.
                // We'll look for strings starting with the prefix in a tailwind environment.
                // Matches "any-class-name-" + prefix + "any-number"
                const regex = new RegExp(`(bg|text|border|ring|from|via|to|shadow|fill|stroke)-${prefix}(\\d+)`, 'g');
                if (regex.test(content)) {
                    content = content.replace(regex, (match, prefixType, num) => {
                        return `${prefixType}-emerald-${num}`;
                    });
                    changed = true;
                }
            });
            
            // 3. Replace RGBA strings (common in Hero sections)
            const rgbaMatches = content.match(/rgba\(\d+,\s*\d+,\s*\d+/g);
            if (rgbaMatches) {
                rgbaMatches.forEach(rgba => {
                    // If it's not a grayscale/black/white rgba
                    const parts = rgba.match(/\d+/g);
                    if (parts) {
                        const [r, g, b] = parts.map(Number);
                        // Check if it's noticeably colored (r, g, b variation)
                        const maxDiff = Math.max(Math.abs(r-g), Math.abs(g-b), Math.abs(r-b));
                        if (maxDiff > 20) {
                            // Replace with emerald rgba (16, 185, 129)
                            content = content.replace(rgba, 'rgba(16, 185, 129');
                            changed = true;
                        }
                    }
                });
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log(`Deep color update in: ${fullPath}`);
            }
        }
    });
}

targetDirs.forEach(dir => {
    const dirPath = path.resolve(__dirname, dir);
    processDir(dirPath);
});
console.log("Color unification complete.");
