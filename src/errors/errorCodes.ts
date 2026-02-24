export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_FILE: 'MISSING_FILE',
  NO_ACCOUNTS_LOADED: 'NO_ACCOUNTS_LOADED',
  FILE_UPLOAD_ERROR: 'FILE_UPLOAD_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];
