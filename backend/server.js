const app = require('./app');
const connectDB = require('./config/db');
const logger = require('./config/logger');

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

connectDB()

const server = app.listen(PORT, () => {
  logger.info(`Server running in ${NODE_ENV} mode on port ${PORT}`, {
    component: 'Server',
    context: 'Startup'
  });
});


const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`, {
    component: 'Server',
    context: 'Shutdown'
  });


  server.close(() => {
    logger.info('HTTP server closed', { component: 'Server', context: 'Shutdown' });


    const redisClient = app.get('redis');
    if (redisClient && redisClient.isOpen) {
      redisClient.quit()
        .then(() => logger.info('Redis connection closed', { component: 'Redis', context: 'Shutdown' }))
        .catch(err => logger.error('Error closing Redis connection', {
          component: 'Redis',
          context: 'Shutdown',
          error: err.stack
        }))
        .finally(() => process.exit(0));
    } else {
      process.exit(0);
    }
  });


  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down', {
      component: 'Server',
      context: 'Shutdown'
    });
    process.exit(1);
  }, 10000);
};


process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));


process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', {
    component: 'Process',
    context: 'Error',
    error: err.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at Promise', {
    component: 'Process',
    context: 'Error',
    error: reason.stack || reason
  });
  process.exit(1);
});