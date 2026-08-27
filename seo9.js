import fs from 'fs';

fs.writeFileSync('api/og/[id].js', `export default async function handler(req, res) {
  const id = req.query.id;
  const ua = req.headers["user-agent"] || "no-ua";
  const method = req.method || "unknown";
  const host = req.headers["host"] || "no-host";

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(
    "<!DOCTYPE html><html><head><title>OG ENDPOINT HIT</title>" +
    '<meta name="debug-ua" content="' + String(ua).replace(/"/g, "&quot;") + '" />' +
    '<meta name="debug-id" content="' + String(id) + '" />' +
    '<meta name="debug-host" content="' + host + '" />' +
    '<meta name="debug-method" content="' + method + '" />' +
    "</head><body><h1>Debug: function is running</h1>" +
    "<p>UA: " + String(ua) + "</p>" +
    "<p>ID: " + String(id) + "</p>" +
    "<p>Host: " + host + "</p>" +
    "</body></html>"
  );
}
`);
console.log('debug version deployed');