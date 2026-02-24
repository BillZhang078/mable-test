import { Account } from '../models/Account';
import { Transaction, ProcessingResult } from '../models/Transaction';

export class TransactionProcessor {
  private readonly accountIndex: Map<string, Account>;

  // NOTE: The processor holds references to the same Account objects as the
  // AccountStore, so debit/credit calls mutate shared state directly.
  constructor(accounts: Account[]) {
    this.accountIndex = new Map(accounts.map((a) => [a.number, a]));
  }

  process(transactions: Transaction[]): ProcessingResult[] {
    return transactions.map((t) => this.apply(t));
  }

  private apply(transaction: Transaction): ProcessingResult {
    if (transaction.amountCents <= 0) {
      return { transaction, success: false, error: 'Transfer amount must be greater than zero' };
    }

    const from = this.accountIndex.get(transaction.from);
    const to = this.accountIndex.get(transaction.to);

    if (!from) {
      return { transaction, success: false, error: `Account ${transaction.from} not found` };
    }
    if (!to) {
      return { transaction, success: false, error: `Account ${transaction.to} not found` };
    }
    if (!from.canDebit(transaction.amountCents)) {
      return {
        transaction,
        success: false,
        error: `Insufficient funds in account ${transaction.from}`,
      };
    }

    from.debit(transaction.amountCents);
    to.credit(transaction.amountCents);

    return { transaction, success: true };
  }
}
