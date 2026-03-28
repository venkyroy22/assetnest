const fs = require('fs');
const filePath = 'c:\\Users\\venka\\Downloads\\AN\\lib\\tools.ts';
let content = fs.readFileSync(filePath, 'utf8');
content = content.replace(/accent: "#ffffff",\s*\/\/\s*[a-z]+/gi, 'accent: "#ffffff",');
fs.writeFileSync(filePath, content);
console.log("Cleaned up comments in lib/tools.ts");
