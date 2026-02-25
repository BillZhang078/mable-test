export class InsufficientFundsError extends Error {
  constructor(accountNumber: string, balanceCents: number, requestedCents: number) {
    super(
      `Insufficient funds in account ${accountNumber}: ` +
        `balance $${formatCents(balanceCents)}, requested $${formatCents(requestedCents)}`,
    );
    this.name = 'InsufficientFundsError';
  }
}

export class Account {
  readonly number: string;
  private _balanceCents: number;

  constructor(number: string, balanceCents: number) {
    this.number = number;
    this._balanceCents = balanceCents;
  }

  get balance(): number {
    return this._balanceCents;
  }

  get formattedBalance(): string {
    return formatCents(this._balanceCents);
  }

  canDebit(amountCents: number): boolean {
    return this._balanceCents >= amountCents;
  }

  debit(amountCents: number): void {
    if (!this.canDebit(amountCents)) {
      throw new InsufficientFundsError(this.number, this._balanceCents, amountCents);
    }
    this._balanceCents -= amountCents;
  }

  credit(amountCents: number): void {
    this._balanceCents += amountCents;
  }
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2);
}
