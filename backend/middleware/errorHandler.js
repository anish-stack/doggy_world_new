const logger = require('../config/logger');

const NODE_ENV = process.env.NODE_ENV || 'development';


const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  

  logger.error(`${statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`, {
    component: 'Server',
    context: 'Error',
    error: err.stack
  });
  

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors,
    });
  }
  

  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token. Please log in again.'
    });
  }
  

  if (!res.headersSent) {
    res.status(statusCode).json({
      success: false,
      message: NODE_ENV === 'production' ? 'An error occurred' : err.message,
      ...(NODE_ENV !== 'production' && { stack: err.stack })
    });
  }
};

module.exports = errorHandler;

