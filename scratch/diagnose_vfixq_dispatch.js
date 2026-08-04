async function testVfixqDispatch() {
  const vfixqUrls = [
    'http://localhost:3000/api/buildflow/dispatch',
    'https://vfixq.online/api/buildflow/dispatch',
    'https://vfixq-api.vservice.co.th/api/buildflow/dispatch'
  ];

  const payload = {
    sourceSystem: 'Installer Management (VQ)',
    targetSystem: 'BuildFlow Leads',
    ticketNo: '1092837465',
    bookingRef: 'BK-2026-07-24-745',
    customerName: 'คุณอนุรักษ์ เลิศวิริยะ',
    customerPhone: '0899674444',
    lineId: '0899674444',
    customerAddress: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)',
    addressZone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา)',
    latitude: 13.7395,
    longitude: 100.5818,
    installationTypeName: 'งานติดตั้งครัว Built-in Master (ชุดใหญ่)',
    assignedTechTeamName: 'ทีมช่างวิชัย เจริญสุข',
    bookingDate: '2026-07-27',
    timeSlot: 'Morning (09:00 - 12:00)',
    dispatchedAt: new Date().toISOString()
  };

  for (const url of vfixqUrls) {
    console.log(`\nTesting POST ${url}...`);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      console.log('Status code:', res.status, res.statusText);
      const text = await res.text();
      console.log('Response body:', text.slice(0, 300));
    } catch (e) {
      console.error(`Error connecting to ${url}:`, e.message);
    }
  }
}

testVfixqDispatch();
