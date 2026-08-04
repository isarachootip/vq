async function diagnoseBuildFlowApi() {
  console.log('--- 1. Testing GET /api/leads ---');
  try {
    const res1 = await fetch('https://buildflowx.online/api/leads', {
      headers: {
        'Accept': 'application/json',
        'X-User-Id': '1'
      }
    });
    console.log('GET /api/leads status:', res1.status, res1.statusText);
    const body1 = await res1.text();
    console.log('GET /api/leads body:', body1);
  } catch (e) {
    console.error('Error GET /api/leads:', e.message);
  }

  console.log('\n--- 2. Testing GET /api/initial-data ---');
  try {
    const res2 = await fetch('https://buildflowx.online/api/initial-data', {
      headers: {
        'Accept': 'application/json',
        'X-User-Id': '1'
      }
    });
    console.log('GET /api/initial-data status:', res2.status, res2.statusText);
    const body2 = await res2.text();
    console.log('GET /api/initial-data body:', body2);
  } catch (e) {
    console.error('Error GET /api/initial-data:', e.message);
  }
}

diagnoseBuildFlowApi();
