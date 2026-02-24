import { Request, Response, NextFunction } from 'express';
import { AccountStore } from '../services/AccountStore';
import { TransactionProcessor } from '../services/TransactionProcessor';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';
import { formatAccounts } from '../utils/formatters';

export class TransactionController {
  constructor(private readonly store: AccountStore) {}

  process(req: Request, res: Response, next: NextFunction): void {
    if (this.store.count() === 0) {
      return next(
        new AppError(
          409,
          ErrorCode.NO_ACCOUNTS_LOADED,
          'No accounts loaded. Please load account balances before processing transactions.',
        ),
      );
    }
    if (!req.parsedTransactions) {
      return next(
        new AppError(400, ErrorCode.MISSING_FILE, 'No file uploaded. Please attach a CSV file.'),
      );
    }

    const processor = new TransactionProcessor(this.store.getAll());
    const results = processor.process(req.parsedTransactions);
    const successCount = results.filter((r) => r.success).length;

    res.json({
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
      accounts: formatAccounts(this.store.getAll()),
    });
  }
}
