const http = require("node:http");
const { createStore } = require("./domain/store");
const { parseUrl, readJsonBody, sendJson, sendNoContent } = require("./lib/utils");

const store = createStore();
const PORT = process.env.PORT || 3000;

function getAuthToken(req) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer ")) {
    return "";
  }
  return header.slice("Bearer ".length);
}

async function handleRequest(req, res) {
  if (req.method === "OPTIONS") {
    sendNoContent(res);
    return;
  }

  const url = parseUrl(req.url);
  const pathname = url.pathname;

  try {
    if (req.method === "GET" && pathname === "/api/health") {
      sendJson(res, 200, { ok: true, service: "mini-12306-api" });
      return;
    }

    if (req.method === "GET" && pathname === "/api/bootstrap") {
      sendJson(res, 200, store.getPublicSnapshot());
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/register") {
      const body = await readJsonBody(req);
      const user = store.registerPassenger(body);
      sendJson(res, 201, { user });
      return;
    }

    if (req.method === "POST" && pathname === "/api/auth/login") {
      const body = await readJsonBody(req);
      const result = store.login(body);
      sendJson(res, 200, result);
      return;
    }

    if (req.method === "GET" && pathname === "/api/me") {
      const user = store.requireUser(getAuthToken(req));
      sendJson(res, 200, { user });
      return;
    }

    if (req.method === "GET" && pathname === "/api/trains") {
      const trains = store.queryTrains({
        date: url.searchParams.get("date"),
        from: url.searchParams.get("from"),
        to: url.searchParams.get("to"),
      });
      sendJson(res, 200, { trains });
      return;
    }

    if (req.method === "GET" && pathname === "/api/tickets") {
      const tickets = store.listMyTickets(getAuthToken(req));
      sendJson(res, 200, { tickets });
      return;
    }

    if (req.method === "POST" && pathname === "/api/tickets/purchase") {
      const body = await readJsonBody(req);
      const ticket = store.purchaseTicket(getAuthToken(req), body);
      sendJson(res, 201, { ticket });
      return;
    }

    if (req.method === "POST" && pathname === "/api/tickets/refund") {
      const body = await readJsonBody(req);
      const ticket = store.refundTicket(getAuthToken(req), body);
      sendJson(res, 200, { ticket });
      return;
    }

    if (req.method === "POST" && pathname === "/api/tickets/change") {
      const body = await readJsonBody(req);
      const ticket = store.changeTicket(getAuthToken(req), body);
      sendJson(res, 200, { ticket });
      return;
    }

    if (req.method === "GET" && pathname === "/api/admin/settings") {
      const settings = store.getSettings(getAuthToken(req));
      sendJson(res, 200, { settings });
      return;
    }

    if (req.method === "PUT" && pathname === "/api/admin/settings") {
      const body = await readJsonBody(req);
      const settings = store.updateSettings(getAuthToken(req), body);
      sendJson(res, 200, { settings });
      return;
    }

    if (req.method === "POST" && pathname === "/api/debug/reset") {
      store.reset();
      sendJson(res, 200, { ok: true });
      return;
    }

    sendJson(res, 404, { error: "接口不存在。" });
  } catch (error) {
    sendJson(res, 400, { error: error.message || "请求处理失败。" });
  }
}

const server = http.createServer((req, res) => {
  handleRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`Mini-12306 API running on http://localhost:${PORT}`);
});
