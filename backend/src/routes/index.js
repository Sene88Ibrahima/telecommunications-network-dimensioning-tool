const express = require('express');
const router = express.Router();

// Import route modules
const projectRoutes = require('./project.routes');
const gsmCalculatorRoutes = require('./gsm-calculator.routes');
const umtsCalculatorRoutes = require('./umts-calculator.routes');
const hertzianLinkRoutes = require('./hertzian-link.routes');
const opticalLinkRoutes = require('./optical-link.routes');

// Define API routes
router.use('/projects', projectRoutes);
router.use('/calculate/gsm', gsmCalculatorRoutes);
router.use('/calculate/umts', umtsCalculatorRoutes);
router.use('/calculate/hertzian', hertzianLinkRoutes);
router.use('/calculate/optical', opticalLinkRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'API is running' });
});

module.exports = router;
