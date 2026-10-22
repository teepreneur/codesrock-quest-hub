import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const INTERNAL_FIELDS = ['error', 'details', 'hint', 'stack'];
const GENERIC_SERVER_ERROR = 'Something went wrong on our side. Please try again.';

/**
 * In production, stop internal error details (database messages, table and
 * column names, stack traces) from reaching the browser.
 * - 5xx responses: the original body is logged and replaced with a generic message
 * - other error responses: internal fields are removed, the message is kept
 * Outside production, responses are left untouched to help debugging.
 */
export const sanitizeErrors = (req: Request, res: Response, next: NextFunction): void => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const originalJson = res.json.bind(res);

  res.json = (body?: any) => {
    if (res.statusCode >= 500) {
      logger.error('Server error on %s %s: %o', req.method, req.originalUrl, body);
      return originalJson({ success: false, message: GENERIC_SERVER_ERROR });
    }

    if (body && typeof body === 'object' && body.success === false) {
      const cleaned = { ...body };
      INTERNAL_FIELDS.forEach((field) => delete cleaned[field]);
      return originalJson(cleaned);
    }

    return originalJson(body);
  };

  next();
};
