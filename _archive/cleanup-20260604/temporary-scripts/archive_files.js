const fs = require('fs');
const path = require('path');

const archiveDir = '_archive/cleanup-20260604';
const scriptsDir = path.join(archiveDir, 'temporary-scripts');
const testsDir = path.join(archiveDir, 'manual-tests');

[archiveDir, scriptsDir, testsDir].forEach(d => {
    if (!fs.existsSync(d)) {
        fs.mkdirSync(d, { recursive: true });
    }
});

// Patch scripts to archive
const patchScripts = [
    'check_toast.js', 'extract_toast.js', 'fix_details.js', 'fix_fallbacks.js', 
    'fix_imports.js', 'fix_t.js', 'i18n_patch.js', 'patch.js', 'patch_approval_finalize.js', 
    'patch_components.js', 'patch_confirm.js', 'patch_dashboard.js', 'patch_final.js', 
    'patch_locales2.js', 'patch_missed.js', 'patch_missing_t.js', 'patch_react.js', 
    'patch_react2.js', 'patch_react3.js', 'patch_requests.js', 'patch_toast_locales.js', 
    'patch_toast_tsx.js', 'patch_ui.js', 'patch_ui_v2.js'
];

patchScripts.forEach(f => {
    if (fs.existsSync(f)) {
        fs.renameSync(f, path.join(scriptsDir, f));
    }
});

// Manual test scripts to archive
const manualTests = [
    'backend/torture_test.js',
    'backend/torture_test_qty.js'
];

manualTests.forEach(f => {
    if (fs.existsSync(f)) {
        fs.renameSync(f, path.join(testsDir, path.basename(f)));
    }
});

// Verify integrity move
if (!fs.existsSync('backend/scripts')) {
    fs.mkdirSync('backend/scripts', { recursive: true });
}
if (fs.existsSync('backend/verify_integrity.js')) {
    fs.renameSync('backend/verify_integrity.js', 'backend/scripts/verify_integrity.js');
}

// README for archive
const readmeContent = `# Archive: YYYY-MM-DD
Date: 2026-06-04
Reason: Final Demo Release Cleanup

Files archived:
- temporary-scripts/: Node.js patch scripts used to automate i18n and UI sweeps.
- manual-tests/: Destructive/stress test scripts (torture tests) used for validation.

Status: Safe to remove later, kept for reference of how the sweeps were performed.
`;
fs.writeFileSync(path.join(archiveDir, 'README.md'), readmeContent);
console.log('Files archived successfully');
