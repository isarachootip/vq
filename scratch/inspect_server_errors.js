async function inspectServerErrors() {
  const jsRes = await fetch('https://buildflowx.online/assets/index-DG8oQaM4.js');
  const jsText = await jsRes.text();

  const matches = jsText.match(/Failed to [^"']+/g) || [];
  console.log('Error messages found in JS bundle:', [...new Set(matches)]);
}

inspectServerErrors();
