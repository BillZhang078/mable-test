import express, { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { AccountStore } from './services/AccountStore';
import { createAccountsRouter } from './routes/accounts';
import { createTransactionsRouter } from './routes/transactions';

export function createApp(): express.Application {
  const app = express();
  const store = new AccountStore();

  app.use(express.json());

  // Request logger
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()}  ${req.method} ${req.path}`);
    next();
  });

  // Health check — useful for load balancers and container orchestrators
  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/accounts', createAccountsRouter(store));
  app.use('/api/transactions', createTransactionsRouter(store));

  // Global error handler — catches validation errors forwarded via next(err)
  // and any unexpected throws. Must have 4 parameters to be recognised by Express.
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof MulterError) {
      res.status(400).json({ error: `File upload error: ${err.message}` });
      return;
    }
    // Treat validation errors (e.g. missing CSV columns) as 422
    res.status(422).json({ error: err.message });
  });

  return app;
}
