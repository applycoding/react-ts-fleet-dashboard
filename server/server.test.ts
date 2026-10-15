// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { WebSocket } from 'ws';
import { createSimulatorServer } from './simulator';

describe('simulator server', () => {
  let closeServer: (() => Promise<void>) | undefined;

  afterEach(async () => {
    await closeServer?.();
    closeServer = undefined;
  });

  async function start(): Promise<number> {
    const simulator = createSimulatorServer();
    closeServer = simulator.close;
    await new Promise<void>((resolve) => {
      simulator.server.listen(0, '127.0.0.1', () => resolve());
    });
    const address = simulator.server.address();
    if (!address || typeof address === 'string')
      throw new Error('Simulator did not bind a port');
    return address.port;
  }

  it('serves health, history, and acknowledgement', async () => {
    const port = await start();
    const health = await fetch(`http://127.0.0.1:${port}/api/health`);
    expect(health.ok).toBe(true);

    const snapshot = (await fetch(`http://127.0.0.1:${port}/api/snapshot`).then((response) =>
      response.json(),
    )) as { units: unknown[]; alerts: { id: string }[] };
    expect(snapshot.units).toHaveLength(14);
    expect(snapshot.alerts.length).toBeGreaterThan(0);

    const history = (await fetch(
      `http://127.0.0.1:${port}/api/units/m-14/history?points=4`,
    ).then((response) => response.json())) as { samples: unknown[] };
    expect(history.samples).toHaveLength(4);

    const missing = await fetch(`http://127.0.0.1:${port}/api/units/nope/history`);
    expect(missing.status).toBe(404);

    const id = snapshot.alerts[0]?.id ?? '';
    const ack = await fetch(
      `http://127.0.0.1:${port}/api/alerts/${encodeURIComponent(id)}/ack`,
      {
        method: 'POST',
      },
    );
    expect(ack.ok).toBe(true);
    const next = (await fetch(`http://127.0.0.1:${port}/api/snapshot`).then((response) =>
      response.json(),
    )) as { alerts: { id: string }[] };
    expect(next.alerts.map((alert) => alert.id)).not.toContain(id);
  });

  it('pushes a snapshot over the socket', async () => {
    const port = await start();
    const message = await new Promise<{ type?: string; units?: unknown[] }>(
      (resolve, reject) => {
        const socket = new WebSocket(`ws://127.0.0.1:${port}/ws`);
        const timer = setTimeout(() => {
          socket.close();
          reject(new Error('socket timeout'));
        }, 3_000);
        socket.on('message', (data) => {
          clearTimeout(timer);
          socket.close();
          resolve(JSON.parse(String(data)) as { type?: string; units?: unknown[] });
        });
        socket.on('error', (error) => {
          clearTimeout(timer);
          reject(error);
        });
      },
    );
    expect(message.type).toBe('snapshot');
    expect(message.units).toHaveLength(14);
  });
});
