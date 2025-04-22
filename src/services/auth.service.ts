import { prisma } from '../prisma/client';
import { RegisterInput } from '../models/interface';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { JwtUtils } from '../lib/token.config';
import { EmailService } from './email.service';

export class AuthService {
  private emailService = new EmailService();

  // Utility method to generate a random referral code
  private generateReferralCode(): string {
    return Math.random().toString(36).substr(2, 8);
  }

  // Register User
  public async register(data: RegisterInput): Promise<{ message: string }> {
    const { name, email, password, referralCode } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a new referral code for the user
    const newReferralCode = this.generateReferralCode();
    // Set role to "customer" by default
    const role = "customer";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role, // Role is hardcoded to "customer"
        referralCode: newReferralCode,
        referredBy: referralCode || null,
      }
    });

    // If a referral code was provided, perform referral logic
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) {
        await prisma.user.update({
          where: { id: referrer.id },
          data: { points: { increment: 10000 } }
        });

        await prisma.coupon.create({
          data: {
            userId: user.id,
            code: `REF-${Date.now()}`,
            discount: 20000,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
          }
        });
      }
    }

    return { message: "User registered successfully" };
  }

  // Login User
  public async login(email: string, password: string): Promise<{ token: string; user: { id: number; email: string; role: "customer" | "organizer" } }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Invalid credentials");

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error("Invalid credentials");

    const token = JwtUtils.generateToken({
      id: user.id,
      email: user.email,
      role: user.role as "customer" | "organizer"  // Type assertion; in this system, it will always be "customer" on registration.
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as "customer" | "organizer"
      }
    };
  }

  // Request Password Reset
  public async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('No account found with this email');

    // Create a reset token (expires in 1 hour)
    const token = jwt.sign({ id: user.id }, process.env.RESET_TOKEN_SECRET!, {
      expiresIn: '1h',
    });

    // Send the reset email using the email service
    await this.emailService.sendPasswordReset(email, token);

    return { message: 'Password reset email sent successfully' };
  }

  // Reset Password
  public async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    try {
      const payload = jwt.verify(token, process.env.RESET_TOKEN_SECRET!) as { id: number };
      const hashed = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: payload.id },
        data: { password: hashed },
      });

      return { message: 'Password updated successfully' };
    } catch (err) {
      throw new Error('Invalid or expired reset token');
    }
  }
}
