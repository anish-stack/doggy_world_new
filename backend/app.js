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
const sendNotification = require('./utils/sendNotification');
const { handleWebhook } = require('./controller/Consultations/BookingConsultaation');
const setupBullBoard = require('./bullBoard');


dotenv.config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const app = express();
// (async () => {
//   await sendNotification(); 
// })();

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
app.use(cors({
  origin: ['http://localhost:5173'], 
  credentials: true,
}));
app.use(compression());
app.set('trust proxy', true);

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


// app.use(configSecurity.globalLimiter);
// app.use('/api/', configSecurity.apiLimiter);


// Request parsing middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser(process.env.COOKIE_SECRET || 'your-secret-key'));

setupBullBoard(app);
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Routes
app.get('/', (req, res) => res.send('API Running'));  
app.use('/api/v1',router)
app.post('/razorpay-hook', express.raw({ type: 'application/json' }), handleWebhook);

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
