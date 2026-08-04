async function fetchProdLogs() {
  console.log('Fetching production integration logs from https://vibepjm.online/api/integration-logs...');
  try {
    const res = await fetch('https://vibepjm.online/api/integration-logs');
    if (!res.ok) {
      console.error('API responded with error status:', res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log('Source:', data.source);
    console.log('Last 5 logs:');
    console.log(JSON.stringify(data.logs ? data.logs.slice(0, 5) : [], null, 2));
  } catch (err) {
    console.error('Error fetching logs:', err.message);
  }
}

fetchProdLogs();
