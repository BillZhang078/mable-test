import { CsvMapper } from '../services/CsvMapper';
import { accountRowSchema, transactionRowSchema } from '../validation/csvSchemas';
import { csvUploadPipeline } from './csvUploadPipeline';

export const parseAccountsCsv = csvUploadPipeline({
  columns: ['Account', 'Balance'],
  schema: accountRowSchema,
  toModel: CsvMapper.toAccount,
  errorLabel: 'Account balances',
  attach: (req, results) => {
    req.parsedAccounts = results;
  },
});

export const parseTransactionsCsv = csvUploadPipeline({
  columns: ['From', 'To', 'Amount'],
  schema: transactionRowSchema,
  toModel: CsvMapper.toTransaction,
  errorLabel: 'Transactions',
  attach: (req, results) => {
    req.parsedTransactions = results;
  },
});
