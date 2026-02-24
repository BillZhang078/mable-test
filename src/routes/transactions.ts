import { Router } from 'express';
import { uploadCsv } from '../middleware/upload';
import { validateTransactionsCsv } from '../middleware/validateCsv';
import { TransactionController } from '../controllers/TransactionController';

export function createTransactionsRouter(controller: TransactionController): Router {
  const router = Router();

  router.post('/process', uploadCsv.single('file'), validateTransactionsCsv, (req, res, next) =>
    controller.process(req, res, next),
  );

  return router;
}
