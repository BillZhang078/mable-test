import { Account } from '../models/Account';

export class AccountStore {
  private accounts: Map<string, Account> = new Map();

  load(accounts: Account[]): void {
    this.accounts.clear();
    for (const account of accounts) {
      this.accounts.set(account.number, account);
    }
  }

  getAll(): Account[] {
    return [...this.accounts.values()];
  }

  count(): number {
    return this.accounts.size;
  }
}
