import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: err.message,
    });
    return;
  }

  // Handle Supabase/Postgres errors
  if ('code' in err && typeof (err as any).code === 'string' && (err as any).code.startsWith('P')) {
    // PostgreSQL error codes start with numbers but Supabase wraps them
    res.status(400).json({
      success: false,
      message: (err as any).message || 'Database error',
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token expired',
    });
    return;
  }

  // Default error
  console.error('ERROR:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && {
      error: err.message,
      stack: err.stack
    }),
  });
};

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};
