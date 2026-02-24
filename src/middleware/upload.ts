import multer from 'multer';

// Accept files with a .csv extension or a CSV-compatible MIME type.
// Browsers and curl report different MIME types for CSV, so we check both.
const CSV_MIME_TYPES = new Set([
  'text/csv',
  'text/plain',
  'application/csv',
  'application/vnd.ms-excel',
]);

export const uploadCsv = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const isAllowed =
      CSV_MIME_TYPES.has(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv');

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${file.mimetype}". Only CSV files are accepted.`));
    }
  },
});
