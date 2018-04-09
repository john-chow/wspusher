const winston = require('winston');
const { combine, timestamp, label, printf } = winston.format;

const myFormat = printf(info => {
  return `[${process.pid}] ${info.timestamp} ${info.label} ${info.level}: ${info.message}`;
});

const logger = winston.createLogger({
    level:  'debug',
    format: combine(
      label({label: '--'}),
      timestamp(),
      myFormat
    ),
    transports: [
      //
      // - Write to all logs with level `info` and below to `combined.log` 
      // - Write all logs error (and below) to `error.log`.
      //
      new winston.transports.File({ filename: 'log/error.log', level: 'error' }),
      new winston.transports.File({ filename: 'log/combined.log', level: 'info' })
    ],
    exceptionHandlers: [
      new winston.transports.File({ filename: 'log/exceptions.log' })
    ]
  });
  
  //
  // If we're not in production then log to the `console` with the format:
  // `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
  // 
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.simple()
    }));
  }

  module.exports = logger;