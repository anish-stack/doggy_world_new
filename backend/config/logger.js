const { createLogger, format, transports } = require('winston');

const NODE_ENV = process.env.NODE_ENV || 'development';

// Configure Winston logger
const logger = createLogger({
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  format: format.combine(
    format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    format.errors({ stack: true }),
    format.splat(),
    format.json()
  ),
  defaultMeta: { service: 'doggy-world-care' },
  transports: [
    new transports.Console({
      format: format.combine(
        format.colorize(),
        format.printf(({ timestamp, level, message, service, component, context, error }) => {
          let log = `${timestamp} [${service}] ${level}`;
          
          if (component) {
            log += ` [${component}${context ? ':' + context : ''}]`;
          }
          
          log += `: ${message}`;
          
          return log;
        })
      )
    }),
    // Add file transport for production
    ...(NODE_ENV === 'production' ? [
      new transports.File({ filename: 'logs/error.log', level: 'error' }),
      new transports.File({ filename: 'logs/combined.log' })
    ] : [])
  ]
});

module.exports = logger;
