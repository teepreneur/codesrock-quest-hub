import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { AppError } from './errorHandler';

/**
 * Middleware to handle validation errors
 */
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    await Promise.all(validations.map((validation) => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    // Format errors
    const extractedErrors: { [key: string]: string }[] = [];
    errors.array().map((err: any) => extractedErrors.push({ [err.path]: err.msg }));

    throw new AppError(
      `Validation Error: ${JSON.stringify(extractedErrors)}`,
      422
    );
  };
};
