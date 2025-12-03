/**
 * Custom error classes and error handling utilities
 */

/**
 * Base application error class
 */
export class AppError extends Error {
  constructor(message, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Authentication error (401)
 */
export class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error (403)
 */
export class AuthorizationError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

/**
 * Rate limit error (429)
 */
export class RateLimitError extends AppError {
  constructor(retryAfter = null) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Format error for API response
 * @param {Error} err - Error object
 * @returns {Object} Formatted error response
 */
export function formatErrorResponse(err) {
  if (err instanceof AppError) {
    return {
      error: err.message,
      code: err.code,
      status: err.status,
      ...(err.field && { field: err.field }),
      ...(err.retryAfter && { retryAfter: err.retryAfter })
    };
  }

  // Unknown errors - don't expose details in production
  return {
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR',
    status: 500
  };
}

/**
 * Async handler wrapper for API routes
 * Catches errors and formats response
 * @param {Function} handler - API route handler
 * @returns {Function} Wrapped handler
 */
export function asyncHandler(handler) {
  return async (event) => {
    try {
      return await handler(event);
    } catch (err) {
      logger.error('API Error', {
        path: event.url?.pathname,
        method: event.request?.method,
        error: err.message,
        stack: err.stack
      });

      const errorResponse = formatErrorResponse(err);

      return new Response(
        JSON.stringify(errorResponse),
        {
          status: errorResponse.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  };
}

/**
 * Structured logger utility
 */
export const logger = {
  error: (message, context = {}) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      ...context,
      timestamp: new Date().toISOString()
    }));
  },

  warn: (message, context = {}) => {
    console.warn(JSON.stringify({
      level: 'warn',
      message,
      ...context,
      timestamp: new Date().toISOString()
    }));
  },

  info: (message, context = {}) => {
    console.log(JSON.stringify({
      level: 'info',
      message,
      ...context,
      timestamp: new Date().toISOString()
    }));
  }
};
