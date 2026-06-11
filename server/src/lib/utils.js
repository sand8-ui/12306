const crypto = require("node:crypto");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createId(prefix) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 1_000_000) {
        reject(new Error("Request body too large."));
      }
    });
    req.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(new Error("Invalid JSON body."));
      }
    });
    req.on("error", reject);
  });
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  });
  res.end(JSON.stringify(payload));
}

function sendNoContent(res) {
  res.writeHead(204, {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,OPTIONS",
  });
  res.end();
}

function parseUrl(reqUrl) {
  return new URL(reqUrl, "http://localhost");
}

module.exports = {
  clone,
  createId,
  nowIso,
  parseUrl,
  readJsonBody,
  sendJson,
  sendNoContent,
};
