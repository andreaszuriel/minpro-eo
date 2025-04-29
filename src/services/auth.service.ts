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

  /**
   * Register a new user, apply referral logic, and track point history.
   */
  public async register(
    data: RegisterInput
  ): Promise<{ message: string }> {
    const { name, email, password, referralCode } = data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    // Generate a new referral code for this user
    const newReferralCode = this.generateReferralCode();

    // Create the user with default role "customer"
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'customer',
        referralCode: newReferralCode,
        referredBy: referralCode || null,
      },
    });

    // If a valid referral code was provided, reward referrer
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) {
        // 1) Credit points to the referrer
        await prisma.user.update({
          where: { id: referrer.id },
          data: { points: { increment: 10000 } },
        });

        // 2) Track point history for later expiration
        await prisma.pointHistory.create({
          data: {
            userId: referrer.id,
            points: 10000,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            expired: false,
          },
        });

        // 3) Issue coupon to the new user (referee)
        await prisma.coupon.create({
          data: {
            userId: user.id,
            code: `REF-${Date.now()}`,
            discount: 20000,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
          },
        });
      }
    }

    return { message: 'User registered successfully' };
  }

  /**
   * Authenticate a user and return a JWT.
   */
  public async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: { id: number; email: string; role: 'customer' | 'organizer' } }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid credentials');

    const token = JwtUtils.generateToken({
      id: user.id,
      email: user.email,
      role: user.role as 'customer' | 'organizer',
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as 'customer' | 'organizer',
      },
    };
  }

  /**
   * Request a password reset email with a 1-hour token.
   */
  public async requestPasswordReset(
    email: string
  ): Promise<{ message: string }> {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error('No account found with this email');

    const token = jwt.sign({ id: user.id }, process.env.RESET_TOKEN_SECRET!, {
      expiresIn: '1h',
    });

    await this.emailService.sendPasswordReset(email, token);
    return { message: 'Password reset email sent successfully' };
  }

  /**
   * Reset password using a valid reset token.
   */
  public async resetPassword(
    token: string,
    newPassword: string
  ): Promise<{ message: string }> {
    try {
      const payload = jwt.verify(token, process.env.RESET_TOKEN_SECRET!) as { id: number };
      const hashed = await bcrypt.hash(newPassword, 10);

      await prisma.user.update({
        where: { id: payload.id },
        data: { password: hashed },
      });

      return { message: 'Password updated successfully' };
    } catch {
      throw new Error('Invalid or expired reset token');
    }
  }
}
