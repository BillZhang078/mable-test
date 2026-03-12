import { createApp } from './app';

const PORT = process.env.PORT ?? 3001;
const app = createApp();

app.listen(PORT, () => {
  console.log(`Mable banking service running on http://localhost:${PORT}`);
  console.log('');
  console.log('Endpoints:');
  console.log('  POST /api/accounts/load        — upload balances CSV (field: "file")');
  console.log('  GET  /api/accounts             — list current balances');
  console.log('  POST /api/transactions/process — upload transactions CSV (field: "file")');
});
