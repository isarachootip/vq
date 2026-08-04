import fs from 'fs';

try {
  const content = fs.readFileSync('c:\\atgv\\vbooking\\server.js', 'utf8');
  const lines = content.split('\n');
  console.log('vbooking server.js HTTP Handlers:');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('app.get(') || line.includes('app.post(') || line.includes('app.use(')) {
      console.log(`${i + 1}: ${line.trim()}`);
    }
  }
} catch (e) {
  console.error('Error:', e.message);
}
