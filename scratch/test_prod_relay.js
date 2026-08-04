async function testProdRelay() {
  const payload = {
    sourceSystem: 'Installer Management (VQ)',
    targetSystem: 'BuildFlow',
    bookingRef: 'BK-2026-0723-03-test',
    customerName: 'คุณณัฐพล เดชอนันต์ (ทดสอบส่งตรง)',
    customerPhone: '084-777-6655',
    addressZone: 'Zone 1: กรุงเทพฯ (สุขุมวิท - บางนา - ประเวศ)',
    installationTypeName: 'งานปูพื้น SPC / Laminate (50-100 ตร.ม.)',
    assignedTechTeamName: 'ทีมช่างวิชัย เจริญสุข (เอ็นจิเนียริ่ง)',
    bookingDate: '2026-07-25',
    timeSlot: '09:00 - 12:00 (Morning)',
    dispatchedAt: new Date().toISOString()
  };

  console.log('Sending POST to https://vibepjm.online/api/buildflow/dispatch...');
  try {
    const res = await fetch('https://vibepjm.online/api/buildflow/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    console.log('Status code:', res.status, res.statusText);
    const data = await res.json();
    console.log('Response JSON:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testProdRelay();
