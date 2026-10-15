import { createSimulatorServer } from './simulator';

const parsed = Number(process.env.PORT ?? 8787);
const port = Number.isFinite(parsed) ? parsed : 8787;
const { server, close } = createSimulatorServer();

server.listen(port, () => {
  console.log(`Meridian simulator on http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    void close().then(() => process.exit(0));
  });
}
