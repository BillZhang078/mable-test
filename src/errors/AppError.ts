import { ErrorCode } from './errorCodes';

// Operational errors are expected failures (bad input, missing file, etc.).
// Non-operational errors are programmer mistakes or unhandled edge cases —
// these should be logged with full stack traces and return a generic 500.
export class AppError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly isOperational: boolean;

  constructor(statusCode: number, code: ErrorCode, message: string, isOperational = true) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}
