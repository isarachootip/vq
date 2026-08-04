async function inspectLeadPayloadObject() {
  const jsRes = await fetch('https://buildflowx.online/assets/index-DG8oQaM4.js');
  const jsText = await jsRes.text();

  const pos = jsText.indexOf('fetch("/api/leads",{method:"POST"');
  if (pos !== -1) {
    console.log('--- PAYLOAD DEFINITION FOR POST /api/leads ---');
    console.log(jsText.slice(pos - 1200, pos + 300));
  } else {
    console.log('Not found');
  }
}

inspectLeadPayloadObject();
