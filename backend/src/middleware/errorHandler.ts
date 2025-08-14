// Error handling middleware
// Global error handling

import { Request, Response, NextFunction } from 'express';
import { 
  ValidationError, 
  AuthenticationError, 
  AuthorizationError, 
  NotFoundError, 
  DatabaseError, 
  ExternalServiceError 
} from '../types/common';

export const errorHandler = (error: Error, req: Request, res: Response, next: NextFunction): void => {
  console.error('Error occurred:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle specific error types
  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      message: error.message,
      error: 'VALIDATION_ERROR',
      field: error.field
    });
    return;
  }

  if (error instanceof AuthenticationError) {
    res.status(401).json({
      success: false,
      message: error.message,
      error: 'AUTHENTICATION_ERROR'
    });
    return;
  }

  if (error instanceof AuthorizationError) {
    res.status(403).json({
      success: false,
      message: error.message,
      error: 'AUTHORIZATION_ERROR'
    });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      message: error.message,
      error: 'NOT_FOUND_ERROR'
    });
    return;
  }

  if (error instanceof DatabaseError) {
    res.status(500).json({
      success: false,
      message: 'Database operation failed',
      error: 'DATABASE_ERROR'
    });
    return;
  }

  if (error instanceof ExternalServiceError) {
    res.status(503).json({
      success: false,
      message: error.message,
      error: 'EXTERNAL_SERVICE_ERROR',
      service: error.service
    });
    return;
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: 'MONGOOSE_VALIDATION_ERROR',
      details: error.message
    });
    return;
  }

  // Handle Mongoose cast errors (invalid ObjectId)
  if (error.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
      error: 'INVALID_ID_FORMAT'
    });
    return;
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
      error: 'INVALID_TOKEN'
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token has expired',
      error: 'TOKEN_EXPIRED'
    });
    return;
  }

  // Handle MongoDB duplicate key errors
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    res.status(409).json({
      success: false,
      message: 'Resource already exists',
      error: 'DUPLICATE_RESOURCE'
    });
    return;
  }

  // Default error response
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : error.message,
    error: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};
