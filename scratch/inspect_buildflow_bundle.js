async function inspectBundle() {
  try {
    console.log('Fetching BuildFlow main page html...');
    const resHtml = await fetch('https://buildflowx.online/leads');
    const html = await resHtml.text();
    
    // Find script tags
    const scriptMatches = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
    console.log('Script files found:', scriptMatches);

    for (const scriptPath of scriptMatches) {
      const scriptUrl = scriptPath.startsWith('http') ? scriptPath : `https://buildflowx.online${scriptPath}`;
      console.log(`Fetching bundle: ${scriptUrl}...`);
      const jsRes = await fetch(scriptUrl);
      const jsText = await jsRes.text();
      console.log(`Downloaded ${jsText.length} bytes.`);

      // Search for leads API calls, fetch, axios, /api/
      const apiMatches = jsText.match(/["']\/api\/[^"']+["']/g) || [];
      console.log('API routes found in bundle:', [...new Set(apiMatches)]);

      // Search for leads POST handler or lead creation fields
      const leadMatches = jsText.match(/.{0,100}api\/leads.{0,200}/g) || [];
      console.log('Matches around api/leads:');
      leadMatches.forEach((m, idx) => console.log(`[${idx+1}] ${m}\n`));
    }
  } catch (e) {
    console.error('Error inspecting bundle:', e);
  }
}

inspectBundle();
