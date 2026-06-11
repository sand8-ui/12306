const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..", "client");
const port = process.env.CLIENT_PORT || 5173;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

function send(res, status, body, type) {
  res.writeHead(status, { "Content-Type": type });
  res.end(body);
}

http
  .createServer((req, res) => {
    const pathname = req.url === "/" ? "/index.html" : req.url;
    const filePath = path.join(root, pathname);
    if (!filePath.startsWith(root)) {
      send(res, 403, "Forbidden", "text/plain; charset=utf-8");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        send(res, 404, "Not Found", "text/plain; charset=utf-8");
        return;
      }
      const ext = path.extname(filePath);
      send(res, 200, data, contentTypes[ext] || "application/octet-stream");
    });
  })
  .listen(port, () => {
    console.log(`Mini-12306 client running on http://localhost:${port}`);
  });
