const fs = require('fs');

const files = ['frontend/src/pages/dashboard/AdminDashboard.tsx', 'frontend/src/pages/dashboard/UserDashboard.tsx', 'frontend/src/pages/Dashboard.tsx'];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes('<ResponsiveContainer width="100%" height={300}>')) {
      content = content.replace('<ResponsiveContainer width="100%" height={300}>', '<ResponsiveContainer width="100%" height={300} debounce={150}>');
      fs.writeFileSync(file, content);
      console.log(`Patched ${file}`);
    } else {
        console.log(`No match in ${file}`);
    }
  }
}
