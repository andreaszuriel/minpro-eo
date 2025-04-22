import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { z } from 'zod';

export class AuthRouter {
  public router: Router;
  private authController: AuthController;

  constructor() {
    this.router = Router();
    this.authController = new AuthController();
    this.routes();
  }

  private routes(): void {
    // Define validation schemas:
    const registerSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      referralCode: z.string().optional(),
    });

    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    const forgotPasswordSchema = z.object({
      email: z.string().email(),
    });

    const resetPasswordSchema = z.object({
      token: z.string(),
      newPassword: z.string().min(6),
    });

    // Route definitions with validation middleware applied:
    this.router.post(
      '/register', 
      ValidationMiddleware.validate({ body: registerSchema }),
      this.authController.register.bind(this.authController)
    );

    this.router.post(
      '/login', 
      ValidationMiddleware.validate({ body: loginSchema }),
      this.authController.login.bind(this.authController)
    );

    this.router.post(
      '/forgot-password', 
      ValidationMiddleware.validate({ body: forgotPasswordSchema }),
      this.authController.requestPasswordReset.bind(this.authController)
    );

    this.router.post(
      '/reset-password', 
      ValidationMiddleware.validate({ body: resetPasswordSchema }),
      this.authController.resetPassword.bind(this.authController)
    );
  }
}
