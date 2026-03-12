import { Account } from '../models/Account';
import { Transaction, ProcessingResult } from '../models/Transaction';
import { AccountService } from './AccountService';

export class TransactionService {
  constructor(private readonly accountService: AccountService) {}

  processTransactions(transactions: Transaction[]) {
    // Build a Map for O(1) account lookup.
    // These are the same Account objects as the AccountRepository,
    // so debit/credit calls mutate shared state directly.
    const accountsByNumber = new Map(this.accountService.getAll().map((a) => [a.number, a]));

    const results = transactions.map((t) => this.apply(t, accountsByNumber));
    const successCount = results.filter((r) => r.success).length;

    return {
      processed: results.length,
      succeeded: successCount,
      failed: results.length - successCount,
      results: results.map((r) => ({
        from: r.transaction.from,
        to: r.transaction.to,
        amount: (r.transaction.amountCents / 100).toFixed(2),
        success: r.success,
        ...(r.error ? { error: r.error } : {}),
      })),
      accounts: this.accountService.listAccounts().accounts,
    };
  }

  private apply(
    transaction: Transaction,
    accountsByNumber: Map<string, Account>,
  ): ProcessingResult {
    if (transaction.amountCents <= 0) {
      return { transaction, success: false, error: 'Transfer amount must be greater than zero' };
    }

    const from = accountsByNumber.get(transaction.from);
    const to = accountsByNumber.get(transaction.to);

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
