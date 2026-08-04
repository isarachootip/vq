async function testLeadFields() {
  const payloads = [
    {
      name: 'คุณสมเกียรติ มั่นคง',
      phone: '0891234567',
      address: '286 ซอย รามอินทรา 57 เขตบางเขน กรุงเทพฯ',
      lat: 13.851979,
      lng: 100.643406,
      source: 'Installer Management (VQ)',
      status: 'New'
    },
    {
      customer_name: 'คุณสมเกียรติ มั่นคง',
      customer_phone: '0891234567',
      address: '286 ซอย รามอินทรา 57 เขตบางเขน กรุงเทพฯ',
      latitude: 13.851979,
      longitude: 100.643406,
      source: 'Installer Management (VQ)'
    },
    {
      ticket_no: '1092837465',
      name: 'คุณสมเกียรติ มั่นคง',
      phone: '0891234567',
      address: '286 ซอย รามอินทรา 57 เขตบางเขน กรุงเทพฯ',
      zone: 'Zone 1',
      latitude: 13.851979,
      longitude: 100.643406
    }
  ];

  for (let i = 0; i < payloads.length; i++) {
    console.log(`\nTesting payload variant ${i + 1}...`);
    try {
      const res = await fetch('https://buildflowx.online/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payloads[i])
      });
      console.log('Status code:', res.status, res.statusText);
      const text = await res.text();
      console.log('Response body:', text);
    } catch (e) {
      console.error(e.message);
    }
  }
}

testLeadFields();
