async function inspectUsers() {
  const routes = ['/api/initial-data', '/api/users', '/api/system-settings'];
  for (const r of routes) {
    try {
      console.log(`Fetching https://buildflowx.online${r}...`);
      const res = await fetch(`https://buildflowx.online${r}`);
      console.log('Status:', res.status);
      const text = await res.text();
      console.log('Response (first 300 chars):', text.slice(0, 300), '\n');
    } catch (e) {
      console.error(e.message);
    }
  }
}

inspectUsers();
