// src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError, AnyZodObject } from 'zod';

interface Validation {
  body?: AnyZodObject;
  params?: AnyZodObject;
  partial?: boolean;
}

export class ValidationMiddleware {
  static validate(schema: Validation) {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        if (schema.body) {
          const bodySchema = schema.partial ? schema.body.partial() : schema.body;
          req.body = bodySchema.parse(req.body);
        }
        if (schema.params) {
          req.params = schema.params.parse(req.params);
        }
        next();
      } catch (error) {
        if (error instanceof ZodError) {
          res.status(400).json({
            status: res.statusCode,
            errors: error.errors,
          });
          return;
        }
        next(error);
      }
    };
  }
}
