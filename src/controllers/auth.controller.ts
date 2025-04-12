import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

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

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Register User
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const input = registerSchema.parse(req.body);  // Validating input
      const result = await this.authService.register(input);  // Pass validated data to service
      res.status(201).json(result);
    } catch (error: any) {
      console.error(error);
      if (error instanceof z.ZodError) {
        // If validation fails
        res.status(400).json({
          message: "Validation Error",
          errors: error.errors
        });
      } else {
        // Handle other errors, like database or internal errors
        res.status(error.message === "User already exists" ? 400 : 500).json({
          message: error.message || "Server error"
        });
      }
    }
  }

  // Login User
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);  // Validating input
      const { email, password } = input;  // Destructuring validated data
      const result = await this.authService.login(email, password);  // Pass validated data to service
      res.status(200).json({
        data: result
      });
    } catch (error: any) {
      console.error(error);
      if (error instanceof z.ZodError) {
        // If validation fails
        res.status(400).json({
          message: "Validation Error",
          errors: error.errors
        });
      } else {
        // Handle login errors
        res.status(401).json({
          message: "Unauthorized: Failed login, check your credentials",
          error: error.message
        });
      }
    }
  }
}
