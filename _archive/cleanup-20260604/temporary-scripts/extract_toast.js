const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('frontend/src');
let count = 0;
files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
        if (line.includes('showToast(')) {
            // Find everything inside showToast(...)
            const match = line.match(/showToast\(([^)]+)\)/);
            if (match) {
                const inner = match[1];
                if (!inner.includes('t(') && (inner.includes("'") || inner.includes('"') || inner.includes('`'))) {
                    console.log(file, '::', line.trim());
                    count++;
                }
            }
        }
    });
});
console.log('Total matches:', count);
