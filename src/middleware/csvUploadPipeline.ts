import Busboy from 'busboy';
import Joi from 'joi';
import { parse } from 'csv-parse';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors/AppError';
import { ErrorCode } from '../errors/errorCodes';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

const CSV_MIME_TYPES = new Set([
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel',
  'application/octet-stream',
]);

interface CsvUploadOptions<T> {
  columns: string[];
  schema: Joi.ObjectSchema;
  toModel: (row: Record<string, string>) => T;
  errorLabel: string;
  attach: (req: Request, results: T[]) => void;
}

export function csvUploadPipeline<T>(opts: CsvUploadOptions<T>) {
  return function (req: Request, _res: Response, next: NextFunction): void {
    const contentType = req.headers['content-type'] ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return next(
        new AppError(400, ErrorCode.MISSING_FILE, 'No file uploaded. Please attach a CSV file.'),
      );
    }

    const busboy = Busboy({
      headers: req.headers,
      limits: { files: 1, fileSize: MAX_FILE_SIZE },
    });

    let fileReceived = false;
    let settled = false;

    function settle(err?: Error) {
      if (settled) return;
      settled = true;
      next(err);
    }

    busboy.on('file', (_fieldname, fileStream, info) => {
      fileReceived = true;

      const isCsvFile =
        CSV_MIME_TYPES.has(info.mimeType) || info.filename.toLowerCase().endsWith('.csv');
      if (!isCsvFile) {
        fileStream.resume();
        return settle(
          new AppError(
            400,
            ErrorCode.FILE_UPLOAD_ERROR,
            `Invalid file type "${info.mimeType}". Only CSV files are accepted.`,
          ),
        );
      }

      const parser = parse({ skip_empty_lines: true, trim: true });
      const results: T[] = [];
      const errors: string[] = [];
      let headersPending = true;
      let rowIndex = 0;

      parser.on('data', (row: string[]) => {
        if (headersPending) {
          headersPending = false;
          if (
            row.length === opts.columns.length &&
            row.every((val, i) => val.toLowerCase() === opts.columns[i].toLowerCase())
          ) {
            return;
          }
        }

        const record: Record<string, string> = {};
        opts.columns.forEach((col, i) => {
          record[col] = row[i] ?? '';
        });

        rowIndex++;

        const { error } = opts.schema.validate(record, { abortEarly: false });
        if (error) {
          error.details.forEach((d) => errors.push(`Row ${rowIndex}: ${d.message}`));
          return;
        }

        results.push(opts.toModel(record));
      });

      parser.on('end', () => {
        if (errors.length > 0) {
          return settle(
            new AppError(
              422,
              ErrorCode.VALIDATION_ERROR,
              `${opts.errorLabel} validation failed:\n${errors.join('\n')}`,
            ),
          );
        }
        opts.attach(req, results);
        settle();
      });

      parser.on('error', (err) => settle(err));

      fileStream.on('limit', () => {
        fileStream.resume();
        parser.destroy();
        settle(
          new AppError(
            400,
            ErrorCode.FILE_UPLOAD_ERROR,
            `File exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB size limit.`,
          ),
        );
      });

      fileStream.on('error', (err) => {
        parser.destroy();
        settle(err);
      });

      fileStream.pipe(parser);
    });

    busboy.on('finish', () => {
      if (!fileReceived) {
        return settle(
          new AppError(400, ErrorCode.MISSING_FILE, 'No file uploaded. Please attach a CSV file.'),
        );
      }
    });

    busboy.on('error', (err: Error) => settle(err));

    req.pipe(busboy);
  };
}
