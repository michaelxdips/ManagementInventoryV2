const fs = require('fs');

function addTranslation(file) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('useTranslation')) {
        let lines = content.split('\n');
        // Add import
        const lastImportIndex = lines.map(l => l.startsWith('import')).lastIndexOf(true);
        const importLine = file.includes('auth') ? "import { useTranslation } from '../../hooks/useTranslation';" : "import { useTranslation } from '../hooks/useTranslation';";
        lines.splice(lastImportIndex + 1, 0, importLine);
        
        // Add hook
        const compIndex = lines.findIndex(l => l.includes('const ') && l.includes(' = () => {'));
        if (compIndex !== -1) {
            lines.splice(compIndex + 1, 0, "  const { t } = useTranslation();");
        }
        
        fs.writeFileSync(file, lines.join('\n'));
        console.log('Added to', file);
    }
}

addTranslation('frontend/src/pages/auth/Login.tsx');
addTranslation('frontend/src/pages/PasswordSettings.tsx');
