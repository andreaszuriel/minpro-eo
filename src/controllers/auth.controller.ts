// src/controllers/auth.controller.ts

import { Request, Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service';

// Schemas for validation:
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

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  // Register User
  public async register(req: Request, res: Response): Promise<void> {
    try {
      const input = registerSchema.parse(req.body);  // Validate input
      const result = await this.authService.register(input);  // Pass validated data
      res.status(201).json(result);
      return;
    } catch (error: any) {
      console.error(error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Validation Error",
          errors: error.errors
        });
        return;
      } else {
        res.status(error.message === "User already exists" ? 400 : 500).json({
          message: error.message || "Server error"
        });
        return;
      }
    }
  }

  // Login User
  public async login(req: Request, res: Response): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);  // Validate input
      const { email, password } = input;
      const result = await this.authService.login(email, password);  // Process login
      res.status(200).json({ data: result });
      return;
    } catch (error: any) {
      console.error(error);
      if (error instanceof z.ZodError) {
        res.status(400).json({
          message: "Validation Error",
          errors: error.errors
        });
        return;
      } else {
        res.status(401).json({
          message: "Unauthorized: Failed login, check your credentials",
          error: error.message
        });
        return;
      }
    }
  }

  // Request Password Reset
  public async requestPasswordReset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const result = await this.authService.requestPasswordReset(email);
      res.status(200).json(result);
      return;
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ message: error.message || "Failed to request password reset" });
      return;
    }
  }

  // Reset Password
  public async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { token, newPassword } = resetPasswordSchema.parse(req.body);
      const result = await this.authService.resetPassword(token, newPassword);
      res.status(200).json(result);
      return;
    } catch (error: any) {
      console.error(error);
      res.status(400).json({ message: error.message || "Failed to reset password" });
      return;
    }
  }
}
