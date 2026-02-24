import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

declare global {
  namespace Express {
    interface Request {
      parsedAccounts?: Account[];
      parsedTransactions?: Transaction[];
      requestId?: string;
    }
  }
}
