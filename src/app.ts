import crypto from 'crypto';
import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { AccountRepository } from './repositories/AccountRepository';
import { AccountService } from './services/AccountService';
import { TransactionService } from './services/TransactionService';
import { AccountController } from './controllers/AccountController';
import { TransactionController } from './controllers/TransactionController';
import { createAccountsRouter } from './routes/accounts';
import { createTransactionsRouter } from './routes/transactions';
import { AppError } from './errors/AppError';
import { ErrorCode } from './errors/errorCodes';
import { logger } from './utils/logger';

export function createApp(): express.Application {
  const app = express();

  const repo = new AccountRepository();
  const accountService = new AccountService(repo);
  const transactionService = new TransactionService(accountService);
  const accountController = new AccountController(accountService);
  const transactionController = new TransactionController(accountService, transactionService);

  app.use(helmet());
  app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') ?? '*' }));
  app.use(express.json());

  app.use(
    '/api',
    rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Too many requests, please try again later',
      },
    }),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    req.requestId = crypto.randomUUID();
    const start = Date.now();

    res.on('finish', () => {
      logger.info({
        requestId: req.requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs: Date.now() - start,
      });
    });

    next();
  });

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/accounts', createAccountsRouter(accountController));
  app.use('/api/transactions', createTransactionsRouter(transactionController));

  // Express requires 4 params to recognise this as an error handler
  app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError && err.isOperational) {
      logger.warn({ requestId: req.requestId, code: err.code, message: err.message });
      res.status(err.statusCode).json({ code: err.code, message: err.message });
      return;
    }

    logger.error({ requestId: req.requestId, err }, 'Unhandled error');
    res
      .status(500)
      .json({ code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' });
  });

  return app;
}
