import fs from "fs";
const html = fs.readFileSync("/tmp/clothes.html", "utf8");

const regex = /(?:background-image:\s*url\(([^)]+)\)|<img[^>]+src="([^">]+)")/gi;
let m;
const allUrls = [];
while ((m = regex.exec(html)) !== null) {
  const url = m[1] || m[2];
  allUrls.push({
    index: m.index,
    url: url.replace(/^[\s"'\\]+|[\s"'\\]+$/g, "")
  });
}

console.log("Total image URLs found:", allUrls.length);

allUrls.forEach((item, i) => {
  const start = Math.max(0, item.index - 250);
  const end = Math.min(html.length, item.index + 350);
  const snippet = html.substring(start, end).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  console.log(`\n--- ITEM ${i + 1} ---`);
  console.log("URL:", item.url);
  console.log("SNIPPET:", snippet);
});
