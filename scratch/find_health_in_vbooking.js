import fs from 'fs';

try {
  const content = fs.readFileSync('c:\\atgv\\vbooking\\server.js', 'utf8');
  const lines = content.split('\n');
  console.log('Search for health check in vbooking/server.js:');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('dbReady') || lines[i].includes('dbHost') || lines[i].includes('server":"ok"')) {
      console.log(`${i + 1}: ${lines[i].trim()}`);
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
