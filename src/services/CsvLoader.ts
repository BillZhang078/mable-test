import { parse } from 'csv-parse/sync';
import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

// Converts a dollar string like "5000.00" to integer cents (500000).
function parseCents(value: string): number {
  return Math.round(parseFloat(value.trim()) * 100);
}

// Pure CSV parser — no validation. Validation lives in middleware.
export class CsvLoader {
  static parseRows(csvContent: string, expectedColumns: string[]): Record<string, string>[] {
    const rows = parse(csvContent, {
      skip_empty_lines: true,
      trim: true,
    }) as string[][];

    if (rows.length === 0) return [];

    // If the first row matches expected headers, use it; otherwise treat all rows as data.
    const firstRow = rows[0];
    const hasHeaders =
      firstRow.length === expectedColumns.length &&
      firstRow.every((val, i) => val.toLowerCase() === expectedColumns[i].toLowerCase());

    const dataRows = hasHeaders ? rows.slice(1) : rows;
    return dataRows.map((row) => {
      const record: Record<string, string> = {};
      expectedColumns.forEach((col, i) => {
        record[col] = row[i] ?? '';
      });
      return record;
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
