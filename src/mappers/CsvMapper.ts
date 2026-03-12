import { Account } from '../models/Account';
import { Transaction } from '../models/Transaction';

function dollarsToCents(value: string): number {
  return Math.round(parseFloat(value.trim()) * 100);
}

export function toAccount(row: Record<string, string>): Account {
  return new Account(row['Account'], dollarsToCents(row['Balance']));
}

export function toTransaction(row: Record<string, string>): Transaction {
  return {
    from: row['From'],
    to: row['To'],
    amountCents: dollarsToCents(row['Amount']),
  };
}
