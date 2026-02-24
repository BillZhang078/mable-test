import { Request, Response, NextFunction } from 'express';
import { AccountStore } from '../services/AccountStore';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';
import { formatAccounts } from '../utils/formatters';

export class AccountController {
  constructor(private readonly store: AccountStore) {}

  load(req: Request, res: Response, next: NextFunction): void {
    if (!req.parsedAccounts) {
      return next(
        new AppError(400, ErrorCode.MISSING_FILE, 'No file uploaded. Please attach a CSV file.'),
      );
    }
    this.store.load(req.parsedAccounts);
    res.json({
      loaded: req.parsedAccounts.length,
      accounts: formatAccounts(this.store.getAll()),
    });
  }

  list(_req: Request, res: Response): void {
    res.json({ accounts: formatAccounts(this.store.getAll()) });
  }
}
