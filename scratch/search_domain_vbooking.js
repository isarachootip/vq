import fs from 'fs';
import path from 'path';

function searchDirectory(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file === 'node_modules' || file === '.git' || file === 'dist') continue;
    const fullPath = path.join(dir, file);
    try {
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        searchDirectory(fullPath, query);
      } else if (stat.isFile() && (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.md'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes(query)) {
          console.log(`Found "${query}" in: ${fullPath}`);
        }
      }
    } catch (_) {}
  }
}

console.log('Searching for domains in c:\\atgv\\vbooking...');
searchDirectory('c:\\atgv\\vbooking', 'vibepjm.online');
searchDirectory('c:\\atgv\\vbooking', 'buildflowx.online');
searchDirectory('c:\\atgv\\vbooking', 'vfixq.online');
