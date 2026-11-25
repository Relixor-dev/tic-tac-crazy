import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.dirname(fileURLToPath(import.meta.url));
const files = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/src/main.js", ["src/main.js", "text/javascript; charset=utf-8"]],
  ["/src/computer.js", ["src/computer.js", "text/javascript; charset=utf-8"]],
  ["/src/game.js", ["src/game.js", "text/javascript; charset=utf-8"]],
  ["/src/style.css", ["src/style.css", "text/css; charset=utf-8"]],
]);

const server = createServer(async (request, response) => {
  if (request.method !== "GET" && request.method !== "HEAD") {
    response.writeHead(405, { Allow: "GET, HEAD" });
    response.end("Method not allowed");
    return;
  }

  const pathname = new URL(request.url, "http://localhost").pathname;
  const file = files.get(pathname);
  if (!file) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  try {
    const content = await readFile(path.join(root, file[0]));
    response.writeHead(200, {
      "Content-Type": file[1],
      "Cache-Control": "no-store",
    });
    response.end(request.method === "HEAD" ? undefined : content);
  } catch (error) {
    console.error(`Unable to serve ${pathname}:`, error);
    response.writeHead(500);
    response.end("Internal server error");
  }
});

server.on("error", (error) => {
  console.error("Unable to start the game server:", error);
  process.exitCode = 1;
});

server.listen(5000, () => {
  console.log("Game running at http://localhost:5000");
});
