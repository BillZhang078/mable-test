import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { CsvLoader } from '../services/CsvLoader';
import { accountRowSchema, transactionRowSchema } from '../validation/csvSchemas';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';

function assertColumns(rows: Record<string, string>[], required: string[], context: string): void {
  if (rows.length === 0) return;
  const present = Object.keys(rows[0]);
  const missing = required.filter((col) => !present.includes(col));
  if (missing.length > 0) {
    throw new AppError(
      422,
      ErrorCode.VALIDATION_ERROR,
      `${context} CSV is missing required columns: [${missing.join(', ')}]. Found: [${present.join(', ')}]`,
    );
  }
}

function validateRows(
  rows: Record<string, string>[],
  schema: Joi.ObjectSchema,
  context: string,
): void {
  const errors: string[] = [];
  rows.forEach((row, index) => {
    const { error } = schema.validate(row, { abortEarly: false });
    if (error) {
      error.details.forEach((d) => errors.push(`Row ${index + 1}: ${d.message}`));
    }
  });
  if (errors.length > 0) {
    throw new AppError(
      422,
      ErrorCode.VALIDATION_ERROR,
      `${context} validation failed:\n${errors.join('\n')}`,
    );
  }
}

export function validateAccountsCsv(req: Request, _res: Response, next: NextFunction): void {
  if (!req.file) return next();
  try {
    const rows = CsvLoader.parseRows(req.file.buffer.toString('utf-8'));
    assertColumns(rows, ['Account', 'Balance'], 'Account balances');
    validateRows(rows, accountRowSchema, 'Account balances');
    req.parsedAccounts = rows.map(CsvLoader.toAccount);
    next();
  } catch (err) {
    next(err);
  }
}

export function validateTransactionsCsv(req: Request, _res: Response, next: NextFunction): void {
  if (!req.file) return next();
  try {
    const rows = CsvLoader.parseRows(req.file.buffer.toString('utf-8'));
    assertColumns(rows, ['From', 'To', 'Amount'], 'Transactions');
    validateRows(rows, transactionRowSchema, 'Transactions');
    req.parsedTransactions = rows.map(CsvLoader.toTransaction);
    next();
  } catch (err) {
    next(err);
  }
}
