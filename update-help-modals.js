const fs = require('fs');
const path = require('path');

const toolsDir = path.join(__dirname, 'app', 'tools');

function findPageFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat && stat.isDirectory()) {
            results = results.concat(findPageFiles(filePath));
        } else if (file === 'page.tsx') {
            results.push(filePath);
        }
    });
    return results;
}

const files = findPageFiles(toolsDir);

files.forEach(filePath => {
    let content = fs.readFileSync(filePath, 'utf8');

    // Only process files that use HelpModal
    if (!content.includes('<HelpModal')) return;

    let modified = false;

    // We only want to target contents INSIDE <HelpModal ...> ... </HelpModal>
    // Since some files might have other sections, we'll try to find the HelpModal boundaries.
    const helpModalStartIndex = content.indexOf('<HelpModal');
    const helpModalEndIndex = content.lastIndexOf('</HelpModal>');
    if (helpModalStartIndex === -1 || helpModalEndIndex === -1) return;

    let pre = content.substring(0, helpModalStartIndex);
    let modalContent = content.substring(helpModalStartIndex, helpModalEndIndex + 12);
    let post = content.substring(helpModalEndIndex + 12);

    // 1. Upgrade the main container if it uses space-y-12 etc.
    modalContent = modalContent.replace(
        /className="space-y-[^"]*text-left[^"]*"/g, 
        'className="space-y-12 text-zinc-400 leading-relaxed text-[15px] sm:text-[17px] text-left w-full max-w-4xl pb-16"'
    );

    // 2. Upgrade prominent `<section>` tags to have the nice background bubble styling.
    // We only do this for top-level sections that deal with text. We can just add the class safely if it doesn't already have one.
    // Or if it has space-y-4/6 etc.
    modalContent = modalContent.replace(
        /<section([^>]*)>/g,
        (match, p1) => {
            if (p1.includes('className="')) {
                return `<section${p1.replace(/className="/, 'className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50 ')}>`;
            } else {
                return `<section className="bg-zinc-900/30 p-6 sm:p-8 rounded-3xl border border-zinc-800/50"${p1}>`;
            }
        }
    );

    // 3. Upgrade h2/h3 tags inside sections
    modalContent = modalContent.replace(
        /<h[23]([^>]*)>/g,
        (match, p1) => {
            if (p1.includes('className="')) {
                return `<h3${p1.replace(/className="[^"]*"/, 'className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6"')}>`;
            } else {
                return `<h3 className="text-xl sm:text-2xl font-bold tracking-wide text-white mb-6"${p1}>`;
            }
        }
    );
    // Replace closing tags just safely to </h3>
    modalContent = modalContent.replace(/<\/h2>/g, '</h3>');

    // 4. Upgrade grid blocks feature lists to card lists
    // We look for unordered lists or grid layouts that represent features
    // Just finding typical list items with a Check or bullet
    modalContent = modalContent.replace(
        /<div className="p-5 bg-zinc-900\/40 border border-zinc-800\/50 rounded-2xl/g,
        '<div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/60 hover:border-zinc-700 transition-colors'
    );

    if (modalContent !== content.substring(helpModalStartIndex, helpModalEndIndex + 12)) {
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filePath, pre + modalContent + post, 'utf8');
        console.log(`Upgraded HelpModal in ${path.relative(__dirname, filePath)}`);
    }
});

console.log('Finished updating HelpModals.');
