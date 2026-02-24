# Mable Banking Service

A simple banking API that loads account balances and processes daily CSV transfers — preventing overdrafts at each step.

## Quick start

```bash
npm install
npm run dev          # starts on http://localhost:3000
```

## API

### Load account balances

```
POST /api/accounts/load
Content-Type: multipart/form-data
field: file  (CSV with columns: Account, Balance)
```

### Process a day's transfers

```
POST /api/transactions/process
Content-Type: multipart/form-data
field: file  (CSV with columns: From, To, Amount)
```

### View current balances

```
GET /api/accounts
```

### Health check

```
GET /health
```

## Example (curl)

```bash
# Load balances
curl -F "file=@data/mable_account_balances.csv" http://localhost:3000/api/accounts/load

# Process transfers
curl -F "file=@data/mable_transactions.csv" http://localhost:3000/api/transactions/process

# Check balances
curl http://localhost:3000/api/accounts
```

## Development

```bash
npm test              # run tests
npm run test:coverage # with coverage report
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
npm run format        # Prettier (write)
npm run build         # compile to dist/
```

## Docker

```bash
docker build -t mable-banking .
docker run -p 3000:3000 mable-banking
```

## Design notes

- **Money is stored as integer cents** — `$5000.00` → `500000`. This eliminates all floating-point drift.
- **Transfers are processed sequentially** — a mid-batch overdraft fails that transaction but continues the rest.
- **`createApp()` factory** — returns a fresh Express instance with an isolated in-memory store, making unit + integration tests fully independent.
