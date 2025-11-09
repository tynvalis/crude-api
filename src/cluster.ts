import cluster, { Worker } from 'cluster';
import os from 'os';
import http from 'http';
import dotenv from 'dotenv';
import { handleRequest } from './routes/userRoutes';

dotenv.config({ debug: false });

const PORT = parseInt(process.env.PORT ?? '4000', 10);

if (cluster.isPrimary) {
  console.log(`Master PID ${process.pid}. Starting workers...`);

  const cpuCount = os.availableParallelism();
  const workerCount = cpuCount - 1;

  const workers: { worker: Worker; port: number }[] = [];

  for (let i = 1; i <= workerCount; i++) {
    const port = PORT + i;
    const worker = cluster.fork({ WORKER_PORT: port });
    workers.push({ worker, port });
    console.log(`Worker PID ${worker.process.pid} will run on port ${port}`);
  }

  let currentWorker = 0;

  const balancer = http.createServer((req, res) => {
    if (workers.length === 0) {
      res.writeHead(503, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ message: 'No workers available' }));
    }

    const target = workers[currentWorker];
    currentWorker = (currentWorker + 1) % workers.length;

    const proxy = http.request(
      {
        hostname: 'localhost',
        port: target.port,
        method: req.method,
        path: req.url,
        headers: req.headers,
      },
      (proxyRes) => {
        res.writeHead(proxyRes.statusCode ?? 500, proxyRes.headers);
        proxyRes.pipe(res, { end: true });
      },
    );

    req.pipe(proxy, { end: true });

    proxy.on('error', (err) => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message: 'Worker request failed',
          error: err.message,
        }),
      );
    });
  });

  balancer.listen(PORT, () => {
    console.log(`Load balancer listening on http://localhost:${PORT}`);
  });

  const users = new Map<string, any>();

  cluster.on('message', (worker, message: any) => {
    const { type, payload } = message;

    switch (type) {
      case 'getAll':
        worker.send({
          type: 'getAll:response',
          data: Array.from(users.values()),
        });
        break;
      case 'getById':
        worker.send({
          type: 'getById:response',
          data: users.get(payload.id) ?? null,
        });
        break;
      case 'create':
        users.set(payload.user.id, payload.user);
        worker.send({ type: 'create:response', data: payload.user });
        break;
      case 'update':
        users.set(payload.id, payload.user);
        worker.send({ type: 'update:response', data: payload.user });
        break;
      case 'delete':
        users.delete(payload.id);
        worker.send({ type: 'delete:response', data: null });
        break;
    }
  });
} else {
  const WORKER_PORT = parseInt(process.env.WORKER_PORT!, 10);

  const server = http.createServer(async (req, res) => {
    try {
      await handleRequest(req, res);
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          message: 'Internal server error',
          error: err.message,
        }),
      );
    }
  });

  server.listen(WORKER_PORT, () => {
    console.log(`Worker PID ${process.pid} running on port ${WORKER_PORT}`);
  });
}
