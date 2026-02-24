import { Account, InsufficientFundsError } from '../src/models/Account';

describe('Account', () => {
  let account: Account;

  beforeEach(() => {
    account = new Account('1111234522226789', 500000); // $5000.00 in cents
  });

  describe('balance', () => {
    it('returns the balance in cents', () => {
      expect(account.balance).toBe(500000);
    });

    it('formats the balance as a dollar string', () => {
      expect(account.formattedBalance).toBe('5000.00');
    });
  });

  describe('credit', () => {
    it('increases the balance by the given amount', () => {
      account.credit(50000); // $500.00
      expect(account.balance).toBe(550000);
    });
  });

  describe('debit', () => {
    it('decreases the balance by the given amount', () => {
      account.debit(50000);
      expect(account.balance).toBe(450000);
    });

    it('allows debiting the entire balance', () => {
      account.debit(500000);
      expect(account.balance).toBe(0);
    });

    it('throws InsufficientFundsError when amount exceeds balance', () => {
      expect(() => account.debit(500001)).toThrow(InsufficientFundsError);
    });

    it('does not modify the balance when debit fails', () => {
      try {
        account.debit(999999);
      } catch {
        // expected
      }
      expect(account.balance).toBe(500000);
    });
  });

  describe('canDebit', () => {
    it('returns true when balance is sufficient', () => {
      expect(account.canDebit(100000)).toBe(true);
    });

    it('returns true when amount equals balance exactly', () => {
      expect(account.canDebit(500000)).toBe(true);
    });

    it('returns false when amount exceeds balance', () => {
      expect(account.canDebit(500001)).toBe(false);
    });
  });
});
