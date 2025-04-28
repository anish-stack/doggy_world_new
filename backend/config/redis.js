

const redis = require('redis');
const logger = require('./logger');

const redisConfig = {
  url: `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`,
  password: process.env.REDIS_PASSWORD || undefined,
  socket: {
    reconnectStrategy: attempts => Math.min(attempts * 100, 3000)
  }
};


const connect = async () => {
  const client = redis.createClient(redisConfig);

  client.on("error", (err) => {
    logger.error("Redis connection error", { 
      component: 'Redis', 
      context: 'Connection', 
      error: err.stack 
    });
  });
  
  client.on("ready", () => {
    logger.info("Redis is ready", { component: 'Redis', context: 'Connection' });
  });
  
  try {
    await client.connect();
    await client.ping();
    logger.info("Redis connected successfully", { component: 'Redis', context: 'Connection' });
    return client;
  } catch (err) {
    logger.error("Redis connection failed", { 
      component: 'Redis', 
      context: 'Connection', 
      error: err.stack 
    });
    return null;
  }
};

module.exports = {
  connect,
  getRedisConfig: () => redisConfig
};