import { Router, Request, Response, NextFunction } from 'express';
import { CsvLoader } from '../services/CsvLoader';
import { TransactionProcessor } from '../services/TransactionProcessor';
import { AccountStore } from '../services/AccountStore';
import { uploadCsv } from '../middleware/upload';

export function createTransactionsRouter(store: AccountStore): Router {
  const router = Router();

  // POST /api/transactions/process
  // Upload a CSV file of transfers and apply them to the loaded accounts.
  router.post(
    '/process',
    uploadCsv.single('file'),
    (req: Request, res: Response, next: NextFunction) => {
      if (store.count() === 0) {
        res
          .status(409)
          .json({ error: 'No accounts loaded. POST a balances CSV to /api/accounts/load first.' });
        return;
      }
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded. Send a CSV as multipart field "file".' });
        return;
      }

      try {
        const transactions = CsvLoader.loadTransactions(req.file.buffer.toString('utf-8'));
        const processor = new TransactionProcessor(store.getAll());
        const results = processor.process(transactions);

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
          accounts: store.getAll().map((a) => ({ number: a.number, balance: a.formattedBalance })),
        });
      } catch (err) {
        next(err);
      }
    },
  );

  return router;
}
