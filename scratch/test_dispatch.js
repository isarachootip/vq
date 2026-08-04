async function testDispatch() {
  const payload = {
    sourceSystem: 'Installer Management (VQ)',
    targetSystem: 'BuildFlow Leads',
    ticketNo: '1092837465',
    bookingRef: 'BK-2026-07-24-01',
    customerName: 'คุณสมเกียรติ มั่นคง',
    customerPhone: '0891234567',
    lineId: '@somkiat',
    customerAddress: '286 ซอย รามอินทรา 57 แขวงท่าแร้ง เขตบางเขน กรุงเทพมหานคร 10220',
    addressZone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)',
    latitude: 13.851979,
    longitude: 100.643406,
    installationTypeName: 'งานติดตั้งครัว Built-in Master (ชุดใหญ่)',
    assignedTechTeamName: 'ทีมช่างวิชัย เจริญสุข (สัมปทานรุ่งเรือง)',
    bookingDate: '2026-07-24',
    timeSlot: 'Morning (09:00 - 12:00)',
    dispatchedAt: new Date().toISOString()
  };

  console.log('🚀 Sending payload to https://buildflowx.online/leads...');
  try {
    const res = await fetch('https://buildflowx.online/leads', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status code:', res.status);
    console.log('Status text:', res.statusText);
    const text = await res.text();
    console.log('Response body:', text);
  } catch (err) {
    console.error('Error sending request:', err.message);
  }
}

testDispatch();
