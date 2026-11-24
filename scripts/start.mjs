import { spawn } from "node:child_process";
import path from "node:path";

const args = process.argv.slice(2);
let port = process.env.PORT || "3000";
let hostname = "0.0.0.0";

for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if ((arg === "--port" || arg === "-p") && args[i + 1]) {
    port = args[i + 1];
    i++;
  } else if (arg.startsWith("--port=")) {
    port = arg.split("=")[1] || port;
  } else if ((arg === "--host" || arg === "--hostname" || arg === "-H") && args[i + 1]) {
    hostname = args[i + 1];
    i++;
  } else if (arg.startsWith("--host=")) {
    hostname = arg.split("=")[1] || hostname;
  }
}

const nextBin = path.resolve(process.cwd(), "node_modules", ".bin", "next");
const child = spawn(nextBin, ["start", "-p", port, "-H", hostname], {
  stdio: "inherit",
  env: process.env,
});

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exit(code ?? 0);
  }
});
