/**
 * Middleware to catch malformed JSON body errors
 */
function jsonSyntaxErrorHandler(err, req, res, next) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      error: 'Invalid JSON payload',
      details: ['Malformed JSON format in request body']
    });
  }
  next(err);
}

/**
 * Middleware for 404 Not Found endpoints
 */
function notFoundHandler(req, res, next) {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
}

/**
 * Global centralized error handler
 */
function errorHandler(err, req, res, next) {
  console.error('[ServerError]', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal Server Error' : err.name || 'Error',
    message: err.message || 'An unexpected error occurred'
  });
}

module.exports = {
  jsonSyntaxErrorHandler,
  notFoundHandler,
  errorHandler
};
