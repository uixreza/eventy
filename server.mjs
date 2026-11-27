import { createServer } from "node:http";
import next from "next";
import { getToken } from "next-auth/jwt";
import { WebSocketServer } from "ws";
import { getLiveBus } from "./lib/live-bus.mjs";

const port = Number.parseInt(process.env.PORT || "3000", 10);
const hostname = process.env.HOST || "0.0.0.0";
const production = process.argv.includes("--production");
const dev = !production && process.env.NODE_ENV !== "production";

const ALL_TOPICS = [
  "console:events",
  "console:event-reports",
  "console:tickets",
  "console:nav-counts",
  "dashboard:events",
  "dashboard:tickets",
  "dashboard:notifications",
];

const httpServer = createServer((req, res) => {
  handle(req, res);
});

const app = next({ dev, httpServer });
const handle = app.getRequestHandler();
/* HMR and any other framework upgrades still belong to Next; only /api/live
   is consumed by the WebSocket server below. The handler is filled in after
   `app.prepare()`: in Next 16 the wrapper's `getUpgradeHandler()` is not the
   router handler, while `app.upgradeHandler` is the one HMR actually uses. */
let nextUpgradeHandler;
const wss = new WebSocketServer({ noServer: true });

/** Auth.js chooses the cookie prefix from the public scheme, not the port. */
function isSecureRequest(req) {
  const forwarded = req.headers["x-forwarded-proto"];
  const protocol =
    typeof forwarded === "string"
      ? forwarded.split(",")[0].trim()
      : req.socket?.encrypted
        ? "https"
        : "http";
  return protocol === "https";
}

/** Upgrade requests are ordinary HTTP requests, so the session can be decoded. */
async function readIdentity(req) {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) return { authenticated: false, role: "USER" };

  try {
    const token = await getToken({
      req: { headers: req.headers },
      secret,
      secureCookie: isSecureRequest(req),
    });
    if (!token?.id) return { authenticated: false, role: "USER" };
    return {
      authenticated: true,
      userId: String(token.id),
      role: token.role === "ADMIN" ? "ADMIN" : "USER",
    };
  } catch {
    return { authenticated: false, role: "USER" };
  }
}

/**
 * Console topics are admin-only. Dashboard topics go to signed-in accounts,
 * and a targeted message is delivered only to that account (admins still see
 * the console side of the same change).
 */
function allowedTopics(identity, message = {}) {
  if (!identity?.authenticated && identity?.role !== "ADMIN") return [];
  return ALL_TOPICS.filter((topic) => {
    if (topic.startsWith("console:")) return identity.role === "ADMIN";
    if (!identity.authenticated) return false;
    if (message.userId && identity.userId !== message.userId) return false;
    return true;
  });
}

function broadcastRefresh(message) {
  if (!message || message.type !== "refresh" || !Array.isArray(message.topics)) {
    return;
  }

  for (const client of wss.clients) {
    if (client.readyState !== 1) continue;
    const permitted = allowedTopics(client.liveIdentity, message);
    const topics = message.topics.filter((topic) => permitted.includes(topic));
    if (topics.length === 0) continue;
    client.send(JSON.stringify({ ...message, topics }));
  }
}

getLiveBus().listeners.add(broadcastRefresh);

httpServer.on("upgrade", (req, socket, head) => {
  let pathname;
  try {
    pathname = new URL(
      req.url || "/",
      `http://${req.headers.host || "localhost"}`,
    ).pathname;
  } catch {
    socket.destroy();
    return;
  }

  if (pathname !== "/api/live") {
    nextUpgradeHandler(req, socket, head).catch((error) => {
      console.error("Next upgrade failed:", error);
      socket.destroy();
    });
    return;
  }

  readIdentity(req)
    .then((identity) => {
      wss.handleUpgrade(req, socket, head, (client) => {
        client.liveIdentity = identity;
        wss.emit("connection", client, req);
      });
    })
    .catch(() => socket.destroy());
});

wss.on("connection", (client) => {
  client.send(
    JSON.stringify({
      type: "hello",
      topics: allowedTopics(client.liveIdentity),
    }),
  );
});

app
  .prepare()
  .then(() => {
    nextUpgradeHandler = (req, socket, head) =>
      app.upgradeHandler(req, socket, head);
    /* NextCustomServer would otherwise attach its own upgrade listener on the
       first HTTP request. That listener also consumes /api/live, so two
       handlers would fight over the same socket. We route every upgrade from
       the single listener below and forward framework ones explicitly. */
    app.didWebSocketSetup = true;
    httpServer.listen(port, hostname, () => {
      console.log(
        `> Kooja listening at http://localhost:${port} as ${
          dev ? "development" : "production"
        } (WebSocket: /api/live)`,
      );
    });
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
