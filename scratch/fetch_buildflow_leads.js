async function fetchBuildFlowLeads() {
  console.log('Fetching leads from BuildFlow (https://buildflowx.online/api/leads)...');
  try {
    const res = await fetch('https://buildflowx.online/api/leads', {
      headers: {
        'Accept': 'application/json',
        'X-User-Id': 'admin'
      }
    });
    if (!res.ok) {
      console.error('BuildFlow API error status:', res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log('Total leads found:', data.length);
    console.log('Last 5 leads in BuildFlow:');
    console.log(JSON.stringify(data.slice(-5), null, 2));
  } catch (err) {
    console.error('Error fetching BuildFlow leads:', err.message);
  }
}

fetchBuildFlowLeads();
