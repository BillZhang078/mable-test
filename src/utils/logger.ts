import pino from 'pino';

const isTest = process.env.NODE_ENV === 'test';
const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  // Silence all output during tests to keep Jest output clean and avoid
  // pino-pretty's worker thread preventing Jest from exiting.
  level: isTest ? 'silent' : (process.env.LOG_LEVEL ?? 'info'),
  ...(isDev && {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true, ignore: 'pid,hostname' },
    },
  }),
});
