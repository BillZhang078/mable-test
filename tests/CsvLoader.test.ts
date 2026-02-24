import * as fs from 'fs';
import * as path from 'path';
import { CsvLoader } from '../src/services/CsvLoader';

const fixture = (name: string) => fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf-8');

describe('CsvLoader', () => {
  describe('loadAccounts', () => {
    const accounts = () => CsvLoader.loadAccounts(fixture('accounts.csv'));

    it('loads the correct number of accounts', () => {
      expect(accounts()).toHaveLength(3);
    });

    it('parses account numbers as strings', () => {
      expect(accounts()[0].number).toBe('1111234522226789');
    });

    it('converts dollar amounts to integer cents', () => {
      expect(accounts()[0].balance).toBe(500000); // $5000.00
    });

    it('handles amounts with decimal places correctly', () => {
      // $1200.00 → 120000 cents
      const account = accounts().find((a) => a.number === '1212343433335665');
      expect(account?.balance).toBe(120000);
    });
  });

  describe('loadAccounts — validation', () => {
    it('throws when required columns are missing', () => {
      const bad = 'Number,Amount\n1111234522226789,5000.00\n';
      expect(() => CsvLoader.loadAccounts(bad)).toThrow(/missing required columns/i);
    });

    it('names the missing columns in the error message', () => {
      const bad = 'Number,Amount\n1111234522226789,5000.00\n';
      expect(() => CsvLoader.loadAccounts(bad)).toThrow('Account');
    });

    it('throws when an account number is not 16 digits', () => {
      const bad = 'Account,Balance\n12345,5000.00\n';
      expect(() => CsvLoader.loadAccounts(bad)).toThrow(/16-digit/i);
    });

    it('throws when a balance is not a valid dollar amount', () => {
      const bad = 'Account,Balance\n1111234522226789,abc\n';
      expect(() => CsvLoader.loadAccounts(bad)).toThrow(/dollar amount/i);
    });

    it('reports all invalid rows, not just the first', () => {
      const bad = 'Account,Balance\n123,abc\n456,xyz\n';
      expect(() => CsvLoader.loadAccounts(bad)).toThrow('Row 2');
    });
  });

  describe('loadTransactions', () => {
    const transactions = () => CsvLoader.loadTransactions(fixture('transactions.csv'));

    it('loads the correct number of transactions', () => {
      expect(transactions()).toHaveLength(2);
    });

    it('parses the from account number', () => {
      expect(transactions()[0].from).toBe('1111234522226789');
    });

    it('parses the to account number', () => {
      expect(transactions()[0].to).toBe('1212343433335665');
    });

    it('converts the amount to integer cents', () => {
      expect(transactions()[0].amountCents).toBe(50000); // $500.00
    });

    it('handles amounts with more than two decimal digits accurately', () => {
      // $320.50 → 32050 cents
      expect(transactions()[1].amountCents).toBe(32050);
    });
  });

  describe('loadTransactions — validation', () => {
    it('throws when required columns are missing', () => {
      const bad = 'Source,Dest,Value\n1111234522226789,1212343433335665,500.00\n';
      expect(() => CsvLoader.loadTransactions(bad)).toThrow(/missing required columns/i);
    });

    it('throws when an account number is not 16 digits', () => {
      const bad = 'From,To,Amount\n12345,1212343433335665,500.00\n';
      expect(() => CsvLoader.loadTransactions(bad)).toThrow(/16-digit/i);
    });

    it('throws when From and To are the same account', () => {
      const bad = 'From,To,Amount\n1111234522226789,1111234522226789,500.00\n';
      expect(() => CsvLoader.loadTransactions(bad)).toThrow(/different/i);
    });

    it('throws when the amount is not a valid dollar amount', () => {
      const bad = 'From,To,Amount\n1111234522226789,1212343433335665,not-a-number\n';
      expect(() => CsvLoader.loadTransactions(bad)).toThrow(/dollar amount/i);
    });
  });
});
