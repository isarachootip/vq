async function inspectAuthHeaders() {
  const jsRes = await fetch('https://buildflowx.online/assets/index-DG8oQaM4.js');
  const jsText = await jsRes.text();

  const pos1 = jsText.indexOf('/api/auth/login');
  if (pos1 !== -1) {
    console.log('--- LOGIN CODE ---');
    console.log(jsText.slice(pos1 - 200, pos1 + 400));
  }

  const matches = jsText.match(/headers:\s*\{[^}]+\}/g) || [];
  console.log('\n--- FETCH HEADERS IN BUNDLE ---');
  console.log([...new Set(matches)].slice(0, 10));
}

inspectAuthHeaders();
