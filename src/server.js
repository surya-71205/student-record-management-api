const app = require('./app');

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(` 🚀 Student Registry API & Dashboard Server Running`);
  console.log(` 🌐 Dashboard UI : http://localhost:${PORT}`);
  console.log(` 📡 REST API Base: http://localhost:${PORT}/api/students`);
  console.log(` 🩺 Health Check : http://localhost:${PORT}/api/health`);
  console.log(` 📊 Statistics   : http://localhost:${PORT}/api/stats`);
  console.log(`======================================================\n`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT signal received: closing HTTP server...');
  server.close(() => {
    console.log('HTTP server closed.');
    process.exit(0);
  });
});

module.exports = server;
