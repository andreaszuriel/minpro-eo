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
    // Define the schemas for validation
    const registerSchema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
      role: z.enum(["customer", "organizer"]),
      referralCode: z.string().optional()
    });

    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(6),
    });

    // Register User
    this.router.post('/register', ValidationMiddleware.validate({ body: registerSchema }), this.authController.register.bind(this.authController));
    this.router.post('/login', ValidationMiddleware.validate({ body: loginSchema }), this.authController.login.bind(this.authController));
  }
}
