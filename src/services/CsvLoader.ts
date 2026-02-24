import { parse } from 'csv-parse/sync';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

// Converts a dollar string like "5000.00" to integer cents (500000).
function parseCents(value: string): number {
  return Math.round(parseFloat(value.trim()) * 100);
}

// Pure CSV parser — no validation. Validation lives in middleware.
export class CsvLoader {
  static parseRows(csvContent: string): Record<string, string>[] {
    return parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  }

  static toAccount(row: Record<string, string>): Account {
    return new Account(row['Account'], parseCents(row['Balance']));
  }

  static toTransaction(row: Record<string, string>): Transaction {
    return {
      from: row['From'],
      to: row['To'],
      amountCents: parseCents(row['Amount']),
    };
  }
}
