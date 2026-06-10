const fs = require('fs');

const orig = fs.readFileSync('original_styles.css', 'utf8');
const curr = fs.readFileSync('src/styles.css', 'utf8');

const origLines = orig.split('\n');
const currLines = curr.split('\n');

const origGuestShellIdx = origLines.findIndex(line => line.startsWith('.guest-shell {'));
const origAuthFooterEndIdx = origLines.findIndex((line, i) => i > origGuestShellIdx && line === '.auth-footer {') + 6;

const currGuestShellIdx = currLines.findIndex(line => line.startsWith('.guest-shell {'));
const currMediaStartIdx = currLines.findIndex((line, i) => i > currGuestShellIdx && line.startsWith('@media (max-width: 520px) {'));

const cleanBlock = origLines.slice(origGuestShellIdx, origAuthFooterEndIdx).join('\n');

let polishedBlock = cleanBlock;

polishedBlock = polishedBlock.replace(
  /.auth-card {[\s\S]*?}/,
  `.auth-card {
  position: relative;
  background: color-mix(in srgb, var(--panel) 94%, transparent);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  padding: 32px;
  box-shadow: var(--shadow-shell);
}`
);

polishedBlock = polishedBlock.replace(
  /.input-control {[\s\S]*?}/,
  `.input-control {
  width: 100%;
  padding: 13px 14px;
  border-radius: 12px;
  border: 1px solid var(--shell-action-border);
  background: var(--shell-action-bg);
  color: var(--text);
  font-size: 15px;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background 0.2s ease;
}`
);

polishedBlock = polishedBlock.replace(
  /.input-control::placeholder {[\s\S]*?}/,
  `.input-control::placeholder {
  color: var(--muted);
}`
);

polishedBlock = polishedBlock.replace(
  /.input-control:focus {[\s\S]*?}/,
  `.input-control:focus,
.input-control:focus-visible {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 22%, transparent);
  background: var(--input-bg);
}`
);

polishedBlock = polishedBlock.replace(
  /.checkbox input {[\s\S]*?}/,
  `.checkbox input {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}`
);

polishedBlock = polishedBlock.replace(
  /.primary-button {[\s\S]*?}/,
  `.primary-button {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--border);
  background: var(--primary);
  color: var(--primary-contrast);
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition:
    transform 0.12s ease,
    box-shadow 0.2s ease;
}`
);

polishedBlock = polishedBlock.replace(
  /.primary-button:hover {[\s\S]*?}/,
  `.primary-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px color-mix(in srgb, var(--primary) 12%, transparent);
}`
);

const finalCSS = currLines.slice(0, currGuestShellIdx).join('\n') + '\n' + polishedBlock + '\n\n' + currLines.slice(currMediaStartIdx).join('\n');

fs.writeFileSync('src/styles.css', finalCSS);
console.log('Fixed styles.css successfully!');
