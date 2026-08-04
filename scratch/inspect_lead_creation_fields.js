async function inspectLeadCreationCode() {
  const jsRes = await fetch('https://buildflowx.online/assets/index-DG8oQaM4.js');
  const jsText = await jsRes.text();

  const pos = jsText.indexOf('fetch("/api/leads"');
  if (pos !== -1) {
    console.log('--- SURROUNDING CODE FOR POST /api/leads ---');
    console.log(jsText.slice(pos - 600, pos + 300));
  } else {
    console.log('Not found');
  }
}

inspectLeadCreationCode();
