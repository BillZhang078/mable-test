import { Account } from '../src/models/Account';
import { Transaction } from '../src/models/Transaction';
import { TransactionProcessor } from '../src/services/TransactionProcessor';

describe('TransactionProcessor', () => {
  let accountA: Account;
  let accountB: Account;
  let processor: TransactionProcessor;

  beforeEach(() => {
    accountA = new Account('1111234522226789', 500000); // $5000.00
    accountB = new Account('1212343433335665', 120000); // $1200.00
    processor = new TransactionProcessor([accountA, accountB]);
  });

  const transfer = (from: string, to: string, amountCents: number): Transaction => ({
    from,
    to,
    amountCents,
  });

  describe('a valid transfer', () => {
    it('reports success', () => {
      const [result] = processor.process([transfer(accountA.number, accountB.number, 50000)]);
      expect(result.success).toBe(true);
    });

    it('debits the source account', () => {
      processor.process([transfer(accountA.number, accountB.number, 50000)]);
      expect(accountA.balance).toBe(450000);
    });

    it('credits the destination account', () => {
      processor.process([transfer(accountA.number, accountB.number, 50000)]);
      expect(accountB.balance).toBe(170000);
    });

    it('returns one result per transaction', () => {
      const results = processor.process([
        transfer(accountA.number, accountB.number, 10000),
        transfer(accountB.number, accountA.number, 5000),
      ]);
      expect(results).toHaveLength(2);
    });
  });

  describe('when the source account has insufficient funds', () => {
    it('reports failure', () => {
      const [result] = processor.process([transfer(accountA.number, accountB.number, 999999)]);
      expect(result.success).toBe(false);
    });

    it('includes a descriptive error message', () => {
      const [result] = processor.process([transfer(accountA.number, accountB.number, 999999)]);
      expect(result.error).toMatch(/insufficient funds/i);
      expect(result.error).toContain(accountA.number);
    });

    it('leaves both account balances unchanged', () => {
      processor.process([transfer(accountA.number, accountB.number, 999999)]);
      expect(accountA.balance).toBe(500000);
      expect(accountB.balance).toBe(120000);
    });
  });

  describe('when the source account does not exist', () => {
    it('reports failure with the unknown account number', () => {
      const [result] = processor.process([transfer('9999999999999999', accountB.number, 100)]);
      expect(result.success).toBe(false);
      expect(result.error).toContain('9999999999999999');
    });
  });

  describe('when the destination account does not exist', () => {
    it('reports failure without debiting the source account', () => {
      processor.process([transfer(accountA.number, '9999999999999999', 100)]);
      expect(accountA.balance).toBe(500000);
    });
  });

  describe('when the transfer amount is zero or negative', () => {
    it('rejects a zero-amount transfer', () => {
      const [result] = processor.process([transfer(accountA.number, accountB.number, 0)]);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/greater than zero/i);
    });

    it('rejects a negative-amount transfer without touching either account', () => {
      processor.process([transfer(accountA.number, accountB.number, -1000)]);
      expect(accountA.balance).toBe(500000);
      expect(accountB.balance).toBe(120000);
    });
  });

  describe('sequential processing of multiple transactions', () => {
    it('applies each transaction in order so earlier ones affect later balances', () => {
      processor.process([
        transfer(accountA.number, accountB.number, 480000), // $4800 — leaves $200 in A
        transfer(accountA.number, accountB.number, 30000), // $300 — should fail, only $200 left
      ]);
      // first succeeds, second fails
      expect(accountA.balance).toBe(20000); // $200.00
      expect(accountB.balance).toBe(600000); // $6000.00
    });

    it('marks the second transfer as failed when the first drains the source', () => {
      const results = processor.process([
        transfer(accountA.number, accountB.number, 480000),
        transfer(accountA.number, accountB.number, 30000),
      ]);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });
});
