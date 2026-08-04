async function checkStatus() {
  const urls = [
    'https://vibepjm.online/api/health',
    'https://vibepjm.online/api/db/status',
    'https://vibepjm.online/api/integration-logs'
  ];
  for (const url of urls) {
    console.log(`Checking ${url}...`);
    try {
      const res = await fetch(url);
      console.log('Status:', res.status, res.statusText);
      console.log('Content-Type:', res.headers.get('content-type'));
      const text = await res.text();
      console.log('Body snippet:', text.slice(0, 200));
    } catch (e) {
      console.error('Error:', e.message);
    }
  }
}
checkStatus();
