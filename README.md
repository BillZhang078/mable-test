# Mable Banking Service

A simple banking API that loads account balances from a CSV file and processes a day's transfers — rejecting any transaction that would overdraw an account.

## Quick Start

```bash
npm install
npm run dev          # starts on http://localhost:3000
```

Or with Docker:

```bash
docker compose up -d --build
```

## Running Tests

```bash
npm test              # run all tests
npm run test:coverage # with coverage report
npm run lint          # ESLint
npm run typecheck     # tsc --noEmit
```

## API Endpoints

### Load Account Balances

```
POST /api/accounts/load
Content-Type: multipart/form-data
field: file (CSV — columns: Account, Balance)
```

Accepts a CSV with or without headers. Account numbers must be 16 digits. Balances are dollar amounts (e.g. `5000.00`).

### Process Transfers

```
POST /api/transactions/process
Content-Type: multipart/form-data
field: file (CSV — columns: From, To, Amount)
```

Each transfer is applied sequentially. If a transfer would overdraw the source account, it is skipped and marked as failed — processing continues with the remaining transfers. The response includes per-transaction results and final account balances.

### View Current Balances

```
GET /api/accounts
```

## Example

```bash
curl -F "file=@mable_account_balances.csv" http://localhost:3000/api/accounts/load
curl -F "file=@mable_transactions.csv" http://localhost:3000/api/transactions/process
curl http://localhost:3000/api/accounts
```

## Project Structure

```
src/
├── models/             Account and Transaction domain objects
├── services/
│   ├── AccountStore    In-memory account storage (Map for O(1) lookup)
│   ├── CsvMapper       Maps CSV rows to domain objects
│   └── TransactionProcessor  Applies transfers with overdraft protection
├── middleware/
│   ├── csvUploadPipeline     Streaming CSV upload + parse + validate factory
│   └── validateCsv           Configured pipelines for accounts and transactions
├── controllers/        Request handlers (load accounts, process transfers)
├── routes/             Express route wiring
├── validation/         Joi schemas for CSV row validation
└── errors/             Structured error types and codes
```

## Design Decisions

- **Integer cents** — all monetary values stored as integers (`$5000.00` → `500000`) to eliminate floating-point drift.
- **Streaming CSV pipeline** — file upload, CSV parsing, row validation, and domain mapping happen in a single streaming pass. The request pipes through busboy into csv-parse with per-row Joi validation — no intermediate string or array buffering.
- **Header auto-detection** — CSVs work with or without a header row. If the first row matches the expected column names (case-insensitive), it's treated as a header and skipped.
- **Sequential transfer processing** — transactions are applied in order so earlier transfers affect the balance available for later ones. A failed transfer does not halt the batch.
- **Factory-based app** — `createApp()` returns a fresh Express instance with its own in-memory store, so every test runs in full isolation.
- **Security middleware** — Helmet for HTTP security headers, CORS with configurable origins, and rate limiting (100 req/min) on API routes.
- **Concurrency** — the in-memory store relies on Node's single-threaded event loop, so synchronous balance mutations are safe within one process. A multi-instance deployment would require a database with row-level locking.
