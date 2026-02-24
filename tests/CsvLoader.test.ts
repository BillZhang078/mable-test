import { CsvLoader } from '../src/services/CsvLoader';

describe('CsvLoader', () => {
  describe('parseRows', () => {
    it('parses CSV content into raw row objects', () => {
      const csv = 'Account,Balance\n1111234522226789,5000.00\n';
      expect(CsvLoader.parseRows(csv)).toHaveLength(1);
    });

    it('uses column headers as keys', () => {
      const csv = 'Account,Balance\n1111234522226789,5000.00\n';
      expect(CsvLoader.parseRows(csv)[0]).toMatchObject({
        Account: '1111234522226789',
        Balance: '5000.00',
      });
    });

    it('trims whitespace from values', () => {
      const csv = 'Account,Balance\n  1111234522226789  ,  5000.00  \n';
      expect(CsvLoader.parseRows(csv)[0].Account).toBe('1111234522226789');
    });

    it('skips empty lines', () => {
      const csv = 'Account,Balance\n1111234522226789,5000.00\n\n1212343433335665,1200.00\n';
      expect(CsvLoader.parseRows(csv)).toHaveLength(2);
    });
  });

  describe('toAccount', () => {
    it('converts a row into an Account domain object', () => {
      const account = CsvLoader.toAccount({ Account: '1111234522226789', Balance: '5000.00' });
      expect(account.number).toBe('1111234522226789');
    });

    it('converts the balance to integer cents', () => {
      const account = CsvLoader.toAccount({ Account: '1111234522226789', Balance: '5000.00' });
      expect(account.balance).toBe(500000);
    });

    it('handles fractional dollar amounts accurately', () => {
      const account = CsvLoader.toAccount({ Account: '1111234522226789', Balance: '320.50' });
      expect(account.balance).toBe(32050);
    });
  });

  describe('toTransaction', () => {
    it('converts a row into a Transaction domain object', () => {
      const tx = CsvLoader.toTransaction({
        From: '1111234522226789',
        To: '1212343433335665',
        Amount: '500.00',
      });
      expect(tx.from).toBe('1111234522226789');
      expect(tx.to).toBe('1212343433335665');
    });

    it('converts the amount to integer cents', () => {
      const tx = CsvLoader.toTransaction({
        From: '1111234522226789',
        To: '1212343433335665',
        Amount: '500.00',
      });
      expect(tx.amountCents).toBe(50000);
    });

    it('handles fractional dollar amounts accurately', () => {
      const tx = CsvLoader.toTransaction({
        From: '1111234522226789',
        To: '1212343433335665',
        Amount: '320.50',
      });
      expect(tx.amountCents).toBe(32050);
    });
  });
});
