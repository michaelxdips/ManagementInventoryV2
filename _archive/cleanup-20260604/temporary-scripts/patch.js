const fs = require('fs');

let css = fs.readFileSync('frontend/src/styles.css', 'utf8');

// 1. Add CSS Variables
css = css.replace(
  /:root\s*\{/, 
  `:root {
  --sidebar-expanded-width: 260px;
  --sidebar-collapsed-width: 84px;
  --layout-transition: 240ms cubic-bezier(0.22, 1, 0.36, 1);`
);

// 2. Patch .app-shell transition
css = css.replace(
  /grid-template-columns: 260px minmax\(0, 1fr\);/g,
  'grid-template-columns: var(--sidebar-expanded-width) minmax(0, 1fr);'
);
css = css.replace(
  /grid-template-columns: 84px minmax\(0, 1fr\);/g,
  'grid-template-columns: var(--sidebar-collapsed-width) minmax(0, 1fr);'
);
css = css.replace(
  /transition: grid-template-columns 0.24s cubic-bezier\(0.22, 1, 0.36, 1\);/g,
  'transition: grid-template-columns var(--layout-transition);'
);

// 3. Patch label transitions (user-meta, chevron, sidebar-section)
const oldLabelTransition = `transition:
      opacity 0.25s cubic-bezier(0.4, 0, 0.2, 1),
      width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
      transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);`;

const newLabelTransition = `max-width: 180px;
    opacity: 1;
    transform: translateX(0);
    transition:
      max-width var(--layout-transition),
      opacity 160ms ease,
      transform 160ms ease;`;
css = css.replace(oldLabelTransition, newLabelTransition);
css = css.replace('width: 0;\n    min-width: 0;\n    max-width: 0;\n    overflow: hidden;\n    transform: scaleX(0);', 'max-width: 0;\n    transform: translateX(-6px);');

// 4. Remove sidebar-section specific overrides since it's grouped with brand-text
const oldSection = `.sidebar.is-collapsed .sidebar-section {
    width: 48px;
    max-width: 48px;
    margin: 0;
    text-align: center;
    font-size: 9px;
    letter-spacing: 0.1em;
    line-height: 1;
    opacity: 0;
    transform: scaleY(0);
    pointer-events: none;
  }`;
const newSection = `.sidebar.is-collapsed .sidebar-section {
    max-width: 0;
    margin: 0;
    opacity: 0;
    transform: translateX(-6px);
    pointer-events: none;
  }`;
css = css.replace(oldSection, newSection);

// 5. Replace transition: all with specific properties on user-chip
css = css.replace(
  /transition: all 0.3s cubic-bezier\(0.4, 0, 0.2, 1\);/g,
  'transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;'
);

css = css.replace(
  /transition: all 0.2s ease;/g,
  'transition: border-color 160ms ease, transform 160ms ease, box-shadow 160ms ease;'
);

// 6. Add reduced motion support
const reducedMotion = `
@media (prefers-reduced-motion: reduce) {
  .sidebar,
  .main-panel,
  .app-shell,
  .nav-label,
  .user-meta,
  .chevron,
  .brand-text,
  .sidebar-section {
    transition: none !important;
  }
}
`;
css += reducedMotion;

fs.writeFileSync('frontend/src/styles.css', css);
console.log('Patch complete.');
