import { Account } from '../models/Account';

export function formatAccounts(accounts: Account[]) {
  return accounts.map((a) => ({ number: a.number, balance: a.formattedBalance }));
}
