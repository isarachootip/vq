async function testProjectsEndpoint() {
  const payload = {
    customer_name: 'คุณสมเกียรติ มั่นคง (จาก VFixQ)',
    customer_phone: '0891234567',
    customer_address: '286 ซอย รามอินทรา 57 แขวงท่าแร้ง เขตบางเขน กรุงเทพมหานคร 10220',
    customer_latitude: 13.851979,
    customer_longitude: 100.643406,
    map_url: 'https://www.google.com/maps?q=13.851979,100.643406',
    job_type: ' Quick Service - บริการงานติดตั้ง Multi-Split',
    status: 'New',
    notes: '[VFixQ Ticket: 1092837465] [Zone: Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)] [LINE ID: @somkiat] [Tech: ทีมช่างวิชัย เจริญสุข]'
  };

  console.log('🚀 Sending exact BuildFlow Lead Payload to https://buildflowx.online/api/v1/projects...');
  try {
    const res = await fetch('https://buildflowx.online/api/v1/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status code:', res.status, res.statusText);
    const data = await res.text();
    console.log('Response body:', data);
  } catch (err) {
    console.error('Error sending request:', err);
  }
}

testProjectsEndpoint();
