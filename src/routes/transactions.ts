import { Router } from 'express';
import { parseTransactionsCsv } from '../middleware/validateCsv';
import { TransactionController } from '../controllers/TransactionController';

export function createTransactionsRouter(controller: TransactionController): Router {
  const router = Router();

  router.post('/process', parseTransactionsCsv, (req, res, next) =>
    controller.process(req, res, next),
  );

  return router;
}
