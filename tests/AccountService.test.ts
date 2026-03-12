import { Account } from '../src/models/Account';
import { AccountRepository } from '../src/repositories/AccountRepository';
import { AccountService } from '../src/services/AccountService';

describe('AccountService', () => {
  let repo: AccountRepository;
  let service: AccountService;

  beforeEach(() => {
    repo = new AccountRepository();
    service = new AccountService(repo);
  });

  describe('loadAccounts', () => {
    it('returns the count of loaded accounts', () => {
      const accounts = [
        new Account('1111234522226789', 500000),
        new Account('1212343433335665', 120000),
      ];
      const result = service.loadAccounts(accounts);
      expect(result.loaded).toBe(2);
    });

    it('returns accounts with formatted balances', () => {
      const accounts = [new Account('1111234522226789', 500000)];
      const result = service.loadAccounts(accounts);
      expect(result.accounts).toEqual([{ number: '1111234522226789', balance: '5000.00' }]);
    });

    it('replaces previously loaded accounts', () => {
      service.loadAccounts([new Account('1111234522226789', 500000)]);
      service.loadAccounts([new Account('9999999999999999', 100)]);

      const result = service.listAccounts();
      expect(result.accounts).toHaveLength(1);
      expect(result.accounts[0].number).toBe('9999999999999999');
    });
  });

  describe('listAccounts', () => {
    it('returns empty list when no accounts loaded', () => {
      const result = service.listAccounts();
      expect(result.accounts).toEqual([]);
    });

    it('returns all loaded accounts', () => {
      service.loadAccounts([
        new Account('1111234522226789', 500000),
        new Account('1212343433335665', 120000),
      ]);
      const result = service.listAccounts();
      expect(result.accounts).toHaveLength(2);
    });
  });

  describe('hasAccounts', () => {
    it('returns false when no accounts loaded', () => {
      expect(service.hasAccounts()).toBe(false);
    });

    it('returns true after loading accounts', () => {
      service.loadAccounts([new Account('1111234522226789', 500000)]);
      expect(service.hasAccounts()).toBe(true);
    });
  });

  describe('getAll', () => {
    it('returns the same Account objects (shared references)', () => {
      const account = new Account('1111234522226789', 500000);
      service.loadAccounts([account]);

      const all = service.getAll();
      all[0].debit(100000);

      expect(account.balance).toBe(400000);
    });
  });
});
