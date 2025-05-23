require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');
const winston = require('winston');
const routes = require('./routes');
const path = require('path');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'telecom-dimensioning-tool' },
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`${err.stack}`);
  res.status(500).json({
    error: 'Une erreur est survenue sur le serveur',
    details: process.env.NODE_ENV === 'development' ? err.message : null
  });
});

// Start server
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection has been established successfully.');
    
    // Sync database models (in development)
    // In production, use migrations instead
    if (process.env.NODE_ENV === 'development') {
      // Use { force: true } only for initial setup or when schema changes drastically
      // CAUTION: This will drop all tables and recreate them
      const shouldForceSync = process.env.FORCE_DB_SYNC === 'true';
      await sequelize.sync({ force: shouldForceSync });
      logger.info(`Database synchronized successfully (force: ${shouldForceSync})`);
    }
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API documentation available at http://localhost:${PORT}/api/docs`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    logger.error(error.stack);
    process.exit(1);
  }
};

startServer();
