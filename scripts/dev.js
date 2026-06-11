const { spawn } = require("node:child_process");
const path = require("node:path");

const root = path.join(__dirname, "..");

function launch(label, command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`${label} exited with code ${code}`);
    }
  });

  return child;
}

const api = launch("api", "node", [".\\server\\src\\server.js"]);
const client = launch("client", "node", [".\\scripts\\serve-client.js"]);

function shutdown() {
  api.kill();
  client.kill();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
