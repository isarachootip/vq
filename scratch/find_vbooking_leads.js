import fs from 'fs';

try {
  const content = fs.readFileSync('c:\\atgv\\vbooking\\server.js', 'utf8');
  const lines = content.split('\n');
  console.log('Search for /api/leads in vbooking/server.js:');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('/api/leads')) {
      console.log(`${i + 1}: ${lines[i].trim()}`);
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
