async function verifyEndpoints() {
  const endpoints = [
    'https://buildflowx.online/api/leads',
    'https://buildflowx.online/api/v1/leads',
    'https://buildflowx.online/api/v1/projects',
    'https://buildflowx.online/api/projects'
  ];

  for (const url of endpoints) {
    try {
      console.log(`Checking GET ${url}...`);
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      console.log(`Status: ${res.status}`);
      const text = await res.text();
      console.log(`Response (first 200 chars): ${text.slice(0, 200)}\n`);
    } catch (e) {
      console.error(`Failed to fetch ${url}:`, e.message);
    }
  }
}

verifyEndpoints();
