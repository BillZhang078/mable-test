import { parse } from 'csv-parse/sync';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

// Converts a dollar string like "5000.00" to integer cents (500000).
function parseCents(value: string): number {
  return Math.round(parseFloat(value.trim()) * 100);
}

// Throws a clear error if required columns are absent from the CSV headers.
function assertColumns(rows: Record<string, string>[], required: string[], context: string): void {
  if (rows.length === 0) return;
  const present = Object.keys(rows[0]);
  const missing = required.filter((col) => !present.includes(col));
  if (missing.length > 0) {
    throw new Error(
      `${context} CSV is missing required columns: [${missing.join(', ')}]. ` +
        `Found: [${present.join(', ')}]`,
    );
  }
}

export class CsvLoader {
  static loadAccounts(csvContent: string): Account[] {
    const rows: Record<string, string>[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    assertColumns(rows, ['Account', 'Balance'], 'Account balances');

    return rows.map((row) => new Account(row['Account'], parseCents(row['Balance'])));
  }

  static loadTransactions(csvContent: string): Transaction[] {
    const rows: Record<string, string>[] = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    assertColumns(rows, ['From', 'To', 'Amount'], 'Transactions');

    return rows.map((row) => ({
      from: row['From'],
      to: row['To'],
      amountCents: parseCents(row['Amount']),
    }));
  }
}
