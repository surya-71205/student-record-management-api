const express = require('express');
const path = require('path');
const cors = require('cors');

const studentRoutes = require('./routes/studentRoutes');
const studentController = require('./controllers/studentController');
const {
  jsonSyntaxErrorHandler,
  notFoundHandler,
  errorHandler
} = require('./middleware/errorHandler');

const app = express();

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse incoming JSON and URL-encoded request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Guard against invalid JSON formatting
app.use(jsonSyntaxErrorHandler);

// Serve static frontend assets from public/
app.use(express.static(path.join(__dirname, '..', 'public')));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: `${process.uptime().toFixed(1)}s`
  });
});

// Shortcut endpoint for statistics
app.get('/api/stats', studentController.getStats);

// Main Student Resource REST Endpoints
app.use('/api/students', studentRoutes);

// Fallback 404 for unmatched API requests
app.use('/api/*', notFoundHandler);

// Centralized error handling
app.use(errorHandler);

module.exports = app;
