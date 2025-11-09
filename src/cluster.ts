import cluster from "cluster";
import os from "os";
import http from "http";
import dotenv from "dotenv";
import { handleRequest } from "./routes/userRoutes";
import { User } from "./utils/user.interface";


if (!cluster.isPrimary && !process.env.WORKER_PORT) {
  console.error("only via master process.");
  process.exit(1);
}
dotenv.config({ debug: false });

const PORT = parseInt(process.env.PORT ?? "4000", 10);

if (cluster.isPrimary) {
  const cpuCount = os.availableParallelism();
  const workerCount = cpuCount - 1;

  console.log(`Master PID ${process.pid}. Starting ${workerCount} workers`);

  const users = new Map<string, User>();

  const workers: any[] = [];
  for (let i = 1; i <= workerCount; i++) {
    const worker = cluster.fork({ WORKER_PORT: PORT + i });
    workers.push(worker);
  }

  let current = 0;

  const balancer = http.createServer((req, res) => {
    const targetWorker = workers[current];
    current = (current + 1) % workers.length;

    const proxy = http.request(
      { hostname: "localhost", port: targetWorker.process.env.WORKER_PORT, method: req.method, path: req.url, headers: req.headers },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
        proxyRes.pipe(res);
      }
    );

    req.pipe(proxy);
  });

  balancer.listen(PORT, () => {
    console.log(`Load balancer listening on http://localhost:${PORT}`);
  });

  cluster.on("message", (worker, message: any) => {
    const { type, payload } = message;

    if (type === "getAll") {
      worker.send({ type: "getAll:response", data: Array.from(users.values()) });
    }

    if (type === "getById") {
      worker.send({ type: "getById:response", data: users.get(payload.id) ?? null });
    }

    if (type === "create") {
      users.set(payload.user.id, payload.user);
      worker.send({ type: "create:response", data: payload.user });
    }

    if (type === "update") {
      users.set(payload.id, payload.user);
      worker.send({ type: "update:response", data: payload.user });
    }

    if (type === "delete") {
      users.delete(payload.id);
      worker.send({ type: "delete:response", data: null });
    }
  });

} else {
  const workerPort = parseInt(process.env.WORKER_PORT!, 10);

  const server = http.createServer(async (req, res) => {
    await handleRequest(req, res);
  });
  server.listen(workerPort, () => {
    console.log(`Worker PID ${process.pid} running on port ${workerPort}`);
  });
}
