import https from 'https';

async function fetchPage(url) {
  try {
    const res = await fetch(url);
    console.log("=== URL:", url, "Status:", res.status);
    const html = await res.text();
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    console.log("Title:", titleMatch ? titleMatch[1] : "N/A");
    
    // Google Sites renders dynamic data inside initial data or HTML
    // Look for text fragments
    const textPieces = [];
    const regex = />([^<]+)</g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const str = match[1].trim();
      if (str.length > 2 && !str.includes('{') && !str.includes('function') && !str.startsWith('/*')) {
        textPieces.push(str);
      }
    }
    console.log("Text tokens:", textPieces.slice(0, 40).join(' || '));

    // Look for images or content data
    const imgMatches = html.match(/https:\/\/(?:lh\d+\.googleusercontent\.com|sites\.google\.com\/site\/[^"'\s]+)[^"'\s]+/gi) || [];
    console.log("Image matches count:", imgMatches.length);
    if (imgMatches.length > 0) {
      console.log("Sample images:", [...new Set(imgMatches)].slice(0, 5));
    }
  } catch (err) {
    console.error("Error fetching", url, err.message);
  }
}

async function run() {
  await fetchPage("https://sites.google.com/view/lassbrandclothes/clothes");
  await fetchPage("https://sites.google.com/view/lassbrandclothes");
}

run();
