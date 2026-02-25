import { Router } from 'express';
import { parseAccountsCsv } from '../middleware/validateCsv';
import { AccountController } from '../controllers/AccountController';

export function createAccountsRouter(controller: AccountController): Router {
  const router = Router();

  router.post('/load', parseAccountsCsv, (req, res, next) => controller.load(req, res, next));

  router.get('/', (req, res) => controller.list(req, res));

  return router;
}
