import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Error handler middleware to centralize error handling
 */
export const errorHandler = (
  err: Error, 
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  logger.error('Unhandled error:', err);
  
  // Determine error status code and message
  let statusCode = 500;
  let message = 'Internal server error';
  
  // Handle specific known errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
    message = 'Resource not found';
  }
  
  // Send error response
  res.status(statusCode).json({
    error: message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

/**
 * 404 handler middleware for routes that don't exist
 */
export const notFoundHandler = (
  req: Request, 
  res: Response
): void => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Route not found' });
};