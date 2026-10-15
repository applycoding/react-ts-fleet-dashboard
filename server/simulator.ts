import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { WebSocket, WebSocketServer } from 'ws';
import { HISTORY_POINTS, createEngine } from '../src/sim/engine';

function writeJson(response: ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'content-type',
    'cache-control': 'no-store',
  });
  response.end(JSON.stringify(body));
}

function decodePart(value: string): string | undefined {
  try {
    return decodeURIComponent(value);
  } catch {
    return undefined;
  }
}

function clampPoints(raw: string | null): number {
  const parsed = Number(raw ?? HISTORY_POINTS);
  if (!Number.isFinite(parsed)) return HISTORY_POINTS;
  return Math.min(120, Math.max(2, Math.round(parsed)));
}

export function createSimulatorServer() {
  const engine = createEngine();

  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    if (request.method === 'OPTIONS') {
      writeJson(response, 204, {});
      return;
    }

    const url = new URL(request.url ?? '/', 'http://127.0.0.1');
    const { pathname } = url;

    if (request.method === 'GET' && pathname === '/api/health') {
      writeJson(response, 200, { ok: true });
      return;
    }

    if (request.method === 'GET' && pathname === '/api/snapshot') {
      writeJson(response, 200, engine.snapshot());
      return;
    }

    const historyMatch = pathname.match(/^\/api\/units\/([^/]+)\/history$/);
    if (request.method === 'GET' && historyMatch) {
      const unitId = decodePart(historyMatch[1] ?? '');
      if (!unitId) {
        writeJson(response, 400, { error: 'Bad unit id' });
        return;
      }
      const points = clampPoints(url.searchParams.get('points'));
      const samples = engine.history(unitId, Date.now(), points);
      if (samples.length === 0) {
        writeJson(response, 404, { error: 'Unknown unit' });
        return;
      }
      writeJson(response, 200, { unitId, samples });
      return;
    }

    const ackMatch = pathname.match(/^\/api\/alerts\/([^/]+)\/ack$/);
    if (request.method === 'POST' && ackMatch) {
      const id = decodePart(ackMatch[1] ?? '');
      if (!id) {
        writeJson(response, 400, { error: 'Bad alert id' });
        return;
      }
      engine.acknowledge(id);
      writeJson(response, 200, { ok: true });
      return;
    }

    writeJson(response, 404, { error: 'Not found' });
  });

  const sockets = new WebSocketServer({ server, path: '/ws' });

  const broadcast = () => {
    const payload = JSON.stringify({ type: 'tick', ...engine.snapshot() });
    for (const client of sockets.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(payload);
    }
  };

  sockets.on('connection', (socket) => {
    socket.send(JSON.stringify({ type: 'snapshot', ...engine.snapshot() }));
  });

  const timer = setInterval(broadcast, 1000);

  const close = () =>
    new Promise<void>((resolve, reject) => {
      clearInterval(timer);
      for (const client of sockets.clients) client.close();
      sockets.close();
      server.close((error) => {
        if (error && (error as NodeJS.ErrnoException).code !== 'ERR_SERVER_NOT_RUNNING') {
          reject(error);
          return;
        }
        resolve();
      });
    });

  return { server, close };
}
