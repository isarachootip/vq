async function testUserIdHeader() {
  const userIds = ['1', 'admin', 'sys_admin', 'usr_admin', '0', 'user_1', 'admin_1', 'user-1'];

  const payload = {
    customer_name: 'คุณสมเกียรติ มั่นคง (ทดสอบส่งจาก VFixQ)',
    customer_phone: '0891234567',
    customer_address: '286 ซอย รามอินทรา 57 แขวงท่าแร้ง เขตบางเขน กรุงเทพมหานคร 10220',
    customer_latitude: 13.851979,
    customer_longitude: 100.643406,
    map_url: 'https://www.google.com/maps?q=13.851979,100.643406',
    job_type: 'Quick Service',
    status: 'New',
    notes: '[VFixQ Ticket: 1092837465] [Zone: Zone 1] [Tech: ทีมช่างวิชัย]'
  };

  for (const uid of userIds) {
    console.log(`\nTesting POST /api/leads with X-User-Id = "${uid}"...`);
    try {
      const res = await fetch('https://buildflowx.online/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-User-Id': uid
        },
        body: JSON.stringify(payload)
      });

      console.log('Status code:', res.status, res.statusText);
      const text = await res.text();
      console.log('Response body:', text);
      if (res.ok) {
        console.log('🎉 SUCCESS! Lead created with X-User-Id =', uid);
        break;
      }
    } catch (e) {
      console.error(e.message);
    }
  }
}

testUserIdHeader();
