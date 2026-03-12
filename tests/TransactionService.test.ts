import { Account } from '../src/models/Account';
import { AccountRepository } from '../src/repositories/AccountRepository';
import { AccountService } from '../src/services/AccountService';
import { TransactionService } from '../src/services/TransactionService';
import { Transaction } from '../src/models/Transaction';

describe('TransactionService', () => {
  let accountA: Account;
  let accountB: Account;
  let accountService: AccountService;
  let transactionService: TransactionService;

  const transfer = (from: string, to: string, amountCents: number): Transaction => ({
    from,
    to,
    amountCents,
  });

  beforeEach(() => {
    accountA = new Account('1111234522226789', 500000); // $5000.00
    accountB = new Account('1212343433335665', 120000); // $1200.00

    const repo = new AccountRepository();
    accountService = new AccountService(repo);
    transactionService = new TransactionService(accountService);

    accountService.loadAccounts([accountA, accountB]);
  });

  describe('response format', () => {
    it('returns processed count, succeeded, and failed counts', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 50000),
      ]);

      expect(result.processed).toBe(1);
      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(0);
    });

    it('formats results with dollar amounts as strings', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 50000),
      ]);

      expect(result.results[0]).toEqual({
        from: '1111234522226789',
        to: '1212343433335665',
        amount: '500.00',
        success: true,
      });
    });

    it('includes error field only for failed transfers', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 50000),
        transfer(accountA.number, '9999999999999999', 10000),
      ]);

      expect(result.results[0]).not.toHaveProperty('error');
      expect(result.results[1].error).toBeDefined();
    });

    it('counts successes and failures separately', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 50000),
        transfer(accountA.number, '9999999999999999', 10000),
      ]);

      expect(result.succeeded).toBe(1);
      expect(result.failed).toBe(1);
    });

    it('returns updated account balances after processing', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 50000),
      ]);

      const a = result.accounts.find(
        (acc: { number: string }) => acc.number === '1111234522226789',
      );
      const b = result.accounts.find(
        (acc: { number: string }) => acc.number === '1212343433335665',
      );
      expect(a?.balance).toBe('4500.00');
      expect(b?.balance).toBe('1700.00');
    });

    it('handles an empty transaction list', () => {
      const result = transactionService.processTransactions([]);

      expect(result.processed).toBe(0);
      expect(result.succeeded).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.results).toEqual([]);
    });
  });

  describe('a valid transfer', () => {
    it('reports success', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 50000),
      ]);
      expect(result.results[0].success).toBe(true);
    });

    it('debits the source account', () => {
      transactionService.processTransactions([transfer(accountA.number, accountB.number, 50000)]);
      expect(accountA.balance).toBe(450000);
    });

    it('credits the destination account', () => {
      transactionService.processTransactions([transfer(accountA.number, accountB.number, 50000)]);
      expect(accountB.balance).toBe(170000);
    });

    it('returns one result per transaction', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 10000),
        transfer(accountB.number, accountA.number, 5000),
      ]);
      expect(result.results).toHaveLength(2);
    });
  });

  describe('when the source account has insufficient funds', () => {
    it('reports failure', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 999999),
      ]);
      expect(result.results[0].success).toBe(false);
    });

    it('includes a descriptive error message', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 999999),
      ]);
      expect(result.results[0].error).toMatch(/insufficient funds/i);
      expect(result.results[0].error).toContain(accountA.number);
    });

    it('leaves both account balances unchanged', () => {
      transactionService.processTransactions([transfer(accountA.number, accountB.number, 999999)]);
      expect(accountA.balance).toBe(500000);
      expect(accountB.balance).toBe(120000);
    });
  });

  describe('when the source account does not exist', () => {
    it('reports failure with the unknown account number', () => {
      const result = transactionService.processTransactions([
        transfer('9999999999999999', accountB.number, 100),
      ]);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toContain('9999999999999999');
    });
  });

  describe('when the destination account does not exist', () => {
    it('reports failure without debiting the source account', () => {
      transactionService.processTransactions([transfer(accountA.number, '9999999999999999', 100)]);
      expect(accountA.balance).toBe(500000);
    });
  });

  describe('when the transfer amount is zero or negative', () => {
    it('rejects a zero-amount transfer', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 0),
      ]);
      expect(result.results[0].success).toBe(false);
      expect(result.results[0].error).toMatch(/greater than zero/i);
    });

    it('rejects a negative-amount transfer without touching either account', () => {
      transactionService.processTransactions([transfer(accountA.number, accountB.number, -1000)]);
      expect(accountA.balance).toBe(500000);
      expect(accountB.balance).toBe(120000);
    });
  });

  describe('boundary cases', () => {
    it('transfers the exact full balance successfully', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 500000),
      ]);
      expect(result.results[0].success).toBe(true);
      expect(accountA.balance).toBe(0);
      expect(accountB.balance).toBe(620000);
    });

    it('fails when transferring 1 cent more than the balance', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 500001),
      ]);
      expect(result.results[0].success).toBe(false);
      expect(accountA.balance).toBe(500000);
    });

    it('handles a 1-cent transfer', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 1),
      ]);
      expect(result.results[0].success).toBe(true);
      expect(accountA.balance).toBe(499999);
      expect(accountB.balance).toBe(120001);
    });
  });

  describe('sequential processing of multiple transactions', () => {
    it('applies each transaction in order so earlier ones affect later balances', () => {
      transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 480000),
        transfer(accountA.number, accountB.number, 30000),
      ]);
      expect(accountA.balance).toBe(20000);
      expect(accountB.balance).toBe(600000);
    });

    it('marks the second transfer as failed when the first drains the source', () => {
      const result = transactionService.processTransactions([
        transfer(accountA.number, accountB.number, 480000),
        transfer(accountA.number, accountB.number, 30000),
      ]);
      expect(result.results[0].success).toBe(true);
      expect(result.results[1].success).toBe(false);
    });
  });
});
