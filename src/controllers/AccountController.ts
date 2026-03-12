import { Request, Response, NextFunction } from 'express';
import { AccountService } from '../services/AccountService';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';

export class AccountController {
  constructor(private readonly service: AccountService) {}

  load(req: Request, res: Response, next: NextFunction): void {
    if (!req.parsedAccounts) {
      return next(
        new AppError(400, ErrorCode.MISSING_FILE, 'No file uploaded. Please attach a CSV file.'),
      );
    }
    res.json(this.service.loadAccounts(req.parsedAccounts));
  }

  list(_req: Request, res: Response): void {
    res.json(this.service.listAccounts());
  }
}
