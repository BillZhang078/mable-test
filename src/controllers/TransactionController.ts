import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/AccountService';
import { TransactionService } from '../services/TransactionService';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';

export class TransactionController {
  constructor(
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
  ) {}

  process(req: Request, res: Response, next: NextFunction): void {
    if (!this.accountService.hasAccounts()) {
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

    res.json(this.transactionService.processTransactions(req.parsedTransactions));
  }
}
