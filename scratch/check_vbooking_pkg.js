import fs from 'fs';

try {
  const pkg = fs.readFileSync('c:\\atgv\\vbooking\\package.json', 'utf8');
  console.log('vbooking package.json:');
  console.log(pkg);
} catch (e) {
  console.error('Error:', e.message);
}
