async function fetchPage(url) {
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } });
    console.log("=== URL:", url, "Status:", res.status);
    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    console.log("Title:", titleMatch ? titleMatch[1] : "N/A");

    // Check for specific text tokens
    const lines = html.split('\n').filter(l => l.includes('LASS') || l.includes('clothes') || l.includes('R') || l.includes('t-shirt') || l.includes('shirt'));
    console.log("Matching lines count:", lines.length);
    console.log("Sample matching lines:", lines.slice(0, 10).join('\n---\n'));

    // Check JSON blobs in scripts (Google Sites stores data in WIZ_global_data or similar)
    const jsonMatches = html.match(/\["(?:LASS|clothes|R\d+|T-shirt|Hoodie|Cap)[^"]*"/gi);
    if (jsonMatches) {
      console.log("JSON tokens found:", jsonMatches.slice(0, 20));
    }
  } catch (err) {
    console.error("Error fetching", url, err.message);
  }
}

async function run() {
  await fetchPage("https://sites.google.com/view/lassbrandclothes/clothes");
  await fetchPage("https://sites.google.com/view/lassbrandclothes");
  await fetchPage("https://sites.google.com/view/lassbrandclothes/home");
}

run();
