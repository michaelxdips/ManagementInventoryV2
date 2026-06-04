const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src');

function fixTranslations(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            fixTranslations(file);
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            let content = fs.readFileSync(file, 'utf8');
            
            // replace t('key', 'Fallback') -> t('key')
            const newContent = content.replace(/t\(\s*'([^']+)'\s*,\s*'([^']+)'\s*\)/g, "t('$1')");
            if (newContent !== content) {
                fs.writeFileSync(file, newContent);
                console.log('Fixed Fallbacks in', file);
            }
        }
    });
}
fixTranslations(srcDir);
