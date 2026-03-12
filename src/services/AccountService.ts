import { Account } from '../models/Account';
import { AccountRepository } from '../repositories/AccountRepository';
import { formatAccounts } from '../utils/formatters';

export class AccountService {
  constructor(private readonly repo: AccountRepository) {}

  loadAccounts(accounts: Account[]) {
    this.repo.load(accounts);
    return {
      loaded: accounts.length,
      accounts: formatAccounts(this.repo.getAll()),
    };
  }

  listAccounts() {
    return { accounts: formatAccounts(this.repo.getAll()) };
  }

  getAll(): Account[] {
    return this.repo.getAll();
  }

  hasAccounts(): boolean {
    return this.repo.count() > 0;
  }
}
