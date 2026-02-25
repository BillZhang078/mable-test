import * as fs from 'fs';
import * as path from 'path';
import request from 'supertest';
import { createApp } from '../src/app';

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, 'fixtures', name));

describe('API routes', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    // Fresh app instance per test — isolated in-memory store.
    app = createApp();
  });

  describe('GET /health', () => {
    it('returns status ok', async () => {
      const res = await request(app).get('/health').expect(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('GET /api/accounts', () => {
    it('returns an empty list when no accounts have been loaded', async () => {
      const res = await request(app).get('/api/accounts').expect(200);
      expect(res.body.accounts).toEqual([]);
    });
  });

  describe('POST /api/accounts/load', () => {
    it('responds 400 when no file is attached', async () => {
      await request(app).post('/api/accounts/load').expect(400);
    });

    it('loads accounts and returns the count', async () => {
      const res = await request(app)
        .post('/api/accounts/load')
        .attach('file', fixture('accounts.csv'), 'accounts.csv')
        .expect(200);

      expect(res.body.loaded).toBe(3);
    });

    it('returns the loaded accounts with formatted balances', async () => {
      const res = await request(app)
        .post('/api/accounts/load')
        .attach('file', fixture('accounts.csv'), 'accounts.csv')
        .expect(200);

      const account = res.body.accounts.find(
        (a: { number: string }) => a.number === '1111234522226789',
      );
      expect(account?.balance).toBe('5000.00');
    });

    it('returns 422 with a VALIDATION_ERROR code when the CSV has wrong columns', async () => {
      const bad = Buffer.from('Number,Amount\n1111234522226789,5000.00\n');
      const res = await request(app)
        .post('/api/accounts/load')
        .attach('file', bad, 'bad.csv')
        .expect(422);
      expect(res.body.code).toBe('VALIDATION_ERROR');
      expect(res.body.message).toMatch(/validation failed/i);
    });

    it('makes accounts visible via GET /api/accounts after loading', async () => {
      await request(app)
        .post('/api/accounts/load')
        .attach('file', fixture('accounts.csv'), 'accounts.csv');

      const res = await request(app).get('/api/accounts').expect(200);
      expect(res.body.accounts).toHaveLength(3);
    });
  });

  describe('POST /api/transactions/process', () => {
    it('responds 409 with NO_ACCOUNTS_LOADED code when no accounts loaded', async () => {
      const res = await request(app)
        .post('/api/transactions/process')
        .attach('file', fixture('transactions.csv'), 'transactions.csv')
        .expect(409);
      expect(res.body.code).toBe('NO_ACCOUNTS_LOADED');
    });

    it('responds 400 when no file is attached', async () => {
      await request(app)
        .post('/api/accounts/load')
        .attach('file', fixture('accounts.csv'), 'accounts.csv');

      await request(app).post('/api/transactions/process').expect(400);
    });

    describe('with accounts loaded', () => {
      beforeEach(async () => {
        await request(app)
          .post('/api/accounts/load')
          .attach('file', fixture('accounts.csv'), 'accounts.csv');
      });

      it('returns a result for each transaction', async () => {
        const res = await request(app)
          .post('/api/transactions/process')
          .attach('file', fixture('transactions.csv'), 'transactions.csv')
          .expect(200);

        expect(res.body.results).toHaveLength(2);
      });

      it('reports the number of successes and failures', async () => {
        const res = await request(app)
          .post('/api/transactions/process')
          .attach('file', fixture('transactions.csv'), 'transactions.csv')
          .expect(200);

        // Both sample transactions are valid
        expect(res.body.succeeded).toBe(2);
        expect(res.body.failed).toBe(0);
      });

      it('includes updated account balances in the response', async () => {
        const res = await request(app)
          .post('/api/transactions/process')
          .attach('file', fixture('transactions.csv'), 'transactions.csv')
          .expect(200);

        // 1111234522226789: $5000 - $500 + $320.50 = $4820.50
        const accountA = res.body.accounts.find(
          (a: { number: string }) => a.number === '1111234522226789',
        );
        expect(accountA?.balance).toBe('4820.50');
      });

      it('returns 422 when a transaction has the same From and To account', async () => {
        const selfTransfer = Buffer.from(
          'From,To,Amount\n1111234522226789,1111234522226789,100.00\n',
        );
        const res = await request(app)
          .post('/api/transactions/process')
          .attach('file', selfTransfer, 'self.csv')
          .expect(422);
        expect(res.body.code).toBe('VALIDATION_ERROR');
        expect(res.body.message).toMatch(/different/i);
      });

      it('marks a transfer as failed when the source has insufficient funds', async () => {
        const overdraftCsv = Buffer.from(
          'From,To,Amount\n1111234522226789,1212343433335665,9999999.00\n',
        );
        const res = await request(app)
          .post('/api/transactions/process')
          .attach('file', overdraftCsv, 'overdraft.csv')
          .expect(200);

        expect(res.body.results[0].success).toBe(false);
        expect(res.body.results[0].error).toMatch(/insufficient funds/i);
      });
    });
  });
});
