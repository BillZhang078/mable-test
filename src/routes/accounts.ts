import { Router, Request, Response, NextFunction } from 'express';
import { CsvLoader } from '../services/CsvLoader';
import { AccountStore } from '../services/AccountStore';
import { uploadCsv } from '../middleware/upload';

export function createAccountsRouter(store: AccountStore): Router {
  const router = Router();

  // POST /api/accounts/load
  // Upload a CSV file to initialise account balances.
  router.post(
    '/load',
    uploadCsv.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded. Send a CSV as multipart field "file".' });
        return;
      }

      try {
        const accounts = CsvLoader.loadAccounts(req.file.buffer.toString('utf-8'));
        store.load(accounts);
        res.json({ loaded: accounts.length, accounts: formatAccounts(store.getAll()) });
      } catch (err) {
        next(err);
      }
    },
  );

  // GET /api/accounts
  // List all current account balances.
  router.get('/', (_req: Request, res: Response) => {
    res.json({ accounts: formatAccounts(store.getAll()) });
  });

  return router;
}

function formatAccounts(accounts: ReturnType<AccountStore['getAll']>) {
  return accounts.map((a) => ({ number: a.number, balance: a.formattedBalance }));
}
