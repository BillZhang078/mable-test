import { toAccount, toTransaction } from '../src/mappers/CsvMapper';

describe('CsvMapper', () => {
  describe('toAccount', () => {
    it('converts a row into an Account domain object', () => {
      const account = toAccount({ Account: '1111234522226789', Balance: '5000.00' });
      expect(account.number).toBe('1111234522226789');
    });

    it('converts the balance to integer cents', () => {
      const account = toAccount({ Account: '1111234522226789', Balance: '5000.00' });
      expect(account.balance).toBe(500000);
    });

    it('handles fractional dollar amounts accurately', () => {
      const account = toAccount({ Account: '1111234522226789', Balance: '320.50' });
      expect(account.balance).toBe(32050);
    });
  });

  describe('toTransaction', () => {
    it('converts a row into a Transaction domain object', () => {
      const tx = toTransaction({
        From: '1111234522226789',
        To: '1212343433335665',
        Amount: '500.00',
      });
      expect(tx.from).toBe('1111234522226789');
      expect(tx.to).toBe('1212343433335665');
    });

    it('converts the amount to integer cents', () => {
      const tx = toTransaction({
        From: '1111234522226789',
        To: '1212343433335665',
        Amount: '500.00',
      });
      expect(tx.amountCents).toBe(50000);
    });

    it('handles fractional dollar amounts accurately', () => {
      const tx = toTransaction({
        From: '1111234522226789',
        To: '1212343433335665',
        Amount: '320.50',
      });
      expect(tx.amountCents).toBe(32050);
    });
  });
});
