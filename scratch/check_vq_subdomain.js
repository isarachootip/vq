async function checkVQSubdomain() {
  const urls = [
    'https://vq.vibepjm.online/api/health',
    'https://vq.vibepjm.online/api/db/status',
    'https://vq.vibepjm.online/api/integration-logs',
    'https://vq.vibepjm.online/api/buildflow/dispatch'
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
checkVQSubdomain();
