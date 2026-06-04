const fs = require('fs');

const path = require('path');

const srcDir = path.join(__dirname, 'frontend/src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = dir + '/' + file;
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                let content = fs.readFileSync(file, 'utf8');
                if (content.includes('react-i18next')) {
                    // Need to check the relative path to hooks/useTranslation
                    const normalizedFile = file.replace(/\\/g, '/');
                    const parts = normalizedFile.split('frontend/src/');
                    const rel = parts[1]; // e.g. pages/Information.tsx
                    const depth = rel.split('/').length - 1;
                    const prefix = depth === 0 ? './' : '../'.repeat(depth);
                    
                    content = content.replace(/import \{ useTranslation \} from 'react-i18next';/g, `import { useTranslation } from '${prefix}hooks/useTranslation';`);
                    fs.writeFileSync(file, content);
                    console.log('Fixed', file);
                }
            }
        }
    });
    return results;
}
walk(srcDir);

// Fix RequestCalendar.tsx `{ t, i18n }`
const rcPath = path.join(srcDir, 'pages/RequestCalendar.tsx');
let rcContent = fs.readFileSync(rcPath, 'utf8');
rcContent = rcContent.replace(/const \{ t, i18n \} = useTranslation\(\);/, 'const { t, language } = useTranslation();');
rcContent = rcContent.replace(/const locale = i18n\.language === 'id' \? 'id-ID' \: 'en-US';/, "const locale = language === 'id' ? 'id-ID' : 'en-US';");
fs.writeFileSync(rcPath, rcContent);

// Fix status.ts 
const statusPath = path.join(srcDir, 'utils/status.ts');
let statusContent = fs.readFileSync(statusPath, 'utf8');
statusContent = statusContent.replace(/import \{ TFunction \} from 'i18next';/, '');
statusContent = statusContent.replace(/t: TFunction/, 't: any');
fs.writeFileSync(statusPath, statusContent);

console.log('Done');
