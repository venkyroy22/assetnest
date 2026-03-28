const fs = require('fs');
const path = require('path');

const targetDirs = ['app', 'components', 'lib', 'data'];
const extensions = ['.tsx', '.ts', '.js', '.jsx'];

const emeraldColors = ["#10b981", "rgba(16, 185, 129"];

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
            
            // 1. Replace Hex/RGBA emerald
            if (content.includes("#10b981")) {
                content = content.replace(/#10b981/gi, "#ffffff");
                changed = true;
            }
            if (content.includes("rgba(16, 185, 129")) {
                content = content.replace(/rgba\(16, 185, 129/g, "rgba(255, 255, 255");
                changed = true;
            }

            // 2. Replace Tailwind emerald classes
            // We'll map emerald to white or zinc
            const regex = /(bg|text|border|ring|from|via|to|shadow|fill|stroke)-emerald-(\d+)(\/\d+)?/g;
            if (regex.test(content)) {
                content = content.replace(regex, (match, prefix, num, opacity) => {
                    const fallbackOpacity = opacity || "";
                    if (prefix === 'text' || prefix === 'border' || prefix === 'ring') {
                        return `${prefix}-white${fallbackOpacity}`;
                    }
                    if (prefix === 'bg') {
                        // For low numbers (like bg-emerald-500/10), use white/10
                        // For high numbers, maybe zinc or white
                        return `bg-white${fallbackOpacity}`;
                    }
                    return `${prefix}-white${fallbackOpacity}`;
                });
                changed = true;
            }

            // Simple emerald class without number
            const regex2 = /(bg|text|border|ring|from|via|to|shadow|fill|stroke)-emerald(\/\d+)?/g;
            if (regex2.test(content)) {
                content = content.replace(regex2, (match, prefix, opacity) => {
                    return `${prefix}-white${opacity || ""}`;
                });
                changed = true;
            }

            if (changed) {
                fs.writeFileSync(fullPath, content);
                console.log(`Removed emerald from: ${fullPath}`);
            }
        }
    });
}

targetDirs.forEach(dir => {
    const dirPath = path.resolve(__dirname, dir);
    processDir(dirPath);
});
console.log("Emerald removal complete.");
