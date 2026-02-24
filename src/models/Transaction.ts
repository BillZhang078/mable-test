// All amounts in integer cents.
export interface Transaction {
  from: string;
  to: string;
  amountCents: number;
}

export interface ProcessingResult {
  transaction: Transaction;
  success: boolean;
  error?: string;
}
