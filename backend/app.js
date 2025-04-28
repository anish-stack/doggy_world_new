const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');

const logger = require('./config/logger');
const redisClient = require('./config/redis');
const configSecurity = require('./config/security');
const errorHandler = require('./middleware/errorHandler');
const router = require('./routes/routes');



dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const app = express();


(async () => {
  try {
    const client = await redisClient.connect();

    if (client) {
    
      app.set('redis', client);
      logger.info('Redis connected and set globally', { component: 'Redis', context: 'Initialization' });
    }
  } catch (err) {
    logger.error('Failed to initialize Redis', { 
      component: 'Redis', 
      context: 'Initialization', 
      error: err.stack 
    });
    // In production, you might want to exit if Redis is critical
    if (NODE_ENV === 'production' && process.env.REDIS_REQUIRED === 'true') {
      process.exit(1);
    }
  }
})();


app.use(helmet());
app.use(cors(configSecurity.corsOptions));
app.use(compression());

if (NODE_ENV === 'production') {
  app.use(morgan('combined', {
    skip: (req, res) => res.statusCode < 400, 
    stream: { write: message => logger.http(message.trim()) }
  }));
} else {
  app.use(morgan('dev', {
    stream: { write: message => logger.http(message.trim()) }
  }));
}


app.use(configSecurity.globalLimiter);
app.use('/api/', configSecurity.apiLimiter);

// Request parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));


if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Routes
app.use('/api/v1',router)
// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Requested resource not found'
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
