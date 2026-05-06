const fs = require('fs');
const path = require('path');

const root = process.cwd();
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git']);

function walk(dir, exts, skip = SKIP_DIRS) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p, exts, skip));
    else if (exts.some((e) => p.endsWith(e))) out.push(p);
  }
  return out;
}

function lineOf(source, index) {
  return source.slice(0, index).split(/\r?\n/).length;
}

function stripQueryAndTemplateNoise(rawPath) {
  return rawPath
    .replace(/\$\{\s*buildQuery\([^}]+\)\s*\}/g, '')
    .replace(/\$\{\s*encodeURIComponent\([^}]+\)\s*\}/g, '${param}')
    .replace(/\?.*$/g, '')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

function normalizePath(rawPath) {
  return stripQueryAndTemplateNoise(rawPath)
    .replace(/\$\{[^}]+\}/g, ':param')
    .replace(/:([A-Za-z0-9_]+)/g, ':param')
    .replace(/\/\d+(?=\/|$)/g, '/:param')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

function methodMatches(frontendMethod, backendMethod) {
  if (frontendMethod === backendMethod) return true;
  if (frontendMethod === 'FETCH') return true;
  if (frontendMethod === 'SSE') return backendMethod === 'GET';
  return false;
}

function classifyFrontendCall(call) {
  if (call.method === 'SSE') return 'sse';
  if (call.method === 'FETCH') return 'manual-fetch';
  return 'http-client';
}

const frontendFiles = walk(path.join(root, 'frontend', 'src'), ['.ts', '.tsx']);
const frontendCalls = [];

for (const file of frontendFiles) {
  const source = fs.readFileSync(file, 'utf8');
  let match;

  const httpCallRe = /http\.(get|post|put|patch|delete)(?:<[^;\n]*?>)?\s*\(\s*([`'"])(.*?)\2/gs;
  while ((match = httpCallRe.exec(source))) {
    frontendCalls.push({
      file: path.relative(root, file),
      line: lineOf(source, match.index),
      method: match[1].toUpperCase(),
      path: match[3],
      source: 'http',
    });
  }

  const fetchRe = /fetch\s*\(\s*`\$\{getApiBaseUrl\(\)\}(.*?)`/gs;
  while ((match = fetchRe.exec(source))) {
    const rawArgs = source.slice(match.index, Math.min(source.length, match.index + 700));
    const methodMatch = rawArgs.match(/method\s*:\s*['"]([A-Z]+)['"]/);
    frontendCalls.push({
      file: path.relative(root, file),
      line: lineOf(source, match.index),
      method: methodMatch ? methodMatch[1].toUpperCase() : 'FETCH',
      path: match[1],
      source: 'manual-fetch',
    });
  }

  const eventSourceRe = /new EventSource\s*\(\s*`\$\{getApiBaseUrl\(\)\}(.*?)`/gs;
  while ((match = eventSourceRe.exec(source))) {
    frontendCalls.push({
      file: path.relative(root, file),
      line: lineOf(source, match.index),
      method: 'SSE',
      path: match[1],
      source: 'event-source',
    });
  }
}

const indexSource = fs.readFileSync(path.join(root, 'backend', 'src', 'index.js'), 'utf8');
const importMap = {};
const mounts = {};

for (const match of indexSource.matchAll(/import\s+(\w+)\s+from\s+'\.\/routes\/(.*?)\.js'/g)) {
  importMap[match[1]] = `${match[2]}.js`;
}

for (const match of indexSource.matchAll(/app\.use\('\/api([^']*)',\s*(\w+)\)/g)) {
  mounts[importMap[match[2]] || match[2]] = `/api${match[1]}`;
}

const backendFiles = walk(path.join(root, 'backend', 'src', 'routes'), ['.js']);
const backendRoutes = [];

for (const file of backendFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const base = mounts[path.basename(file)] || '(unmounted)';
  const routeRe = /router\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)['"]([\s\S]*?)(?=router\.(?:get|post|put|patch|delete)\s*\(|export\s+default|$)/g;
  let match;

  while ((match = routeRe.exec(source))) {
    const tail = match[3];
    const auth = tail.includes('authenticate');
    const authorizeMatch = tail.match(/authorize\((.*?)\)/s);
    const roles = authorizeMatch
      ? authorizeMatch[1].replace(/['"\s]/g, '')
      : auth
        ? 'any-auth'
        : 'public';

    backendRoutes.push({
      file: path.relative(root, file),
      line: lineOf(source, match.index),
      method: match[1].toUpperCase(),
      path: `${base}${match[2] === '/' ? '' : match[2]}`,
      auth,
      roles,
    });
  }
}

const backendRoutesNormalized = backendRoutes.map((route) => ({
  ...route,
  normalized: normalizePath(route.path.replace(/^\/api/, '')),
}));

const matrix = frontendCalls.map((call) => {
  const normalized = normalizePath(call.path);
  const candidates = backendRoutesNormalized.filter((route) => route.normalized === normalized);
  const match = candidates.find((route) => methodMatches(call.method, route.method));

  return {
    ...call,
    category: classifyFrontendCall(call),
    normalized,
    backend: match ? `${match.method} ${match.path}` : 'NO_MATCH',
    roles: match ? match.roles : '',
    backendFile: match ? `${match.file}:${match.line}` : '',
    candidates: candidates.map((route) => `${route.method} ${route.path}`),
  };
});

const summary = {
  frontendCalls: frontendCalls.length,
  backendRoutes: backendRoutes.length,
  matched: matrix.filter((item) => item.backend !== 'NO_MATCH').length,
  noMatch: matrix.filter((item) => item.backend === 'NO_MATCH').length,
  generatedAt: new Date().toISOString(),
};

fs.writeFileSync(
  path.join(root, 'audit_phase2_data.json'),
  `${JSON.stringify({ summary, frontendCalls, backendRoutes, matrix }, null, 2)}\n`,
);

console.log(JSON.stringify(summary, null, 2));
console.log('Wrote audit_phase2_data.json');
