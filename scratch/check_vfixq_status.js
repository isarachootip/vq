async function checkVfixqStatus() {
  const urls = [
    'https://vfixq.online/api/health',
    'https://vfixq.online/api/db/status',
    'https://vfixq.online/api/integration-logs',
    'https://vfixq.online/api/buildflow/dispatch'
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
checkVfixqStatus();
