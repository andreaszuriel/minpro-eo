// services/authService.ts

import { prisma } from '../prisma/client';
import { RegisterInput } from '../models/interface';
import bcrypt from 'bcrypt';
import { JwtUtils } from '../lib/token.config';

export class AuthService {
  private generateReferralCode(): string {
    return Math.random().toString(36).substr(2, 8);
  }

  // Register User
  public async register(data: RegisterInput): Promise<{ message: string }> {
    const { name, email, password, referralCode } = data;

    // Check if user with the same email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a new referral code for the user
    const newReferralCode = this.generateReferralCode();

    // Set role to "customer" by default, no matter what the user sends in the request
    const role = "customer";

    // Create a new user in the database
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role, // Set default role as "customer"
        referralCode: newReferralCode, // Generate a new referral code for the user
        referredBy: referralCode || null, // If referralCode is provided, link it; otherwise set to null
      }
    });

    // Referral and points logic if referral code is used
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) {
        // Increment points for the referrer
        await prisma.user.update({
          where: { id: referrer.id },
          data: { points: { increment: 10000 } }
        });

        // Create a coupon for the new user
        await prisma.coupon.create({
          data: {
            userId: user.id,
            code: `REF-${Date.now()}`,
            discount: 20000,
            expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Coupon expires in 90 days
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

    const isMatch = await bcrypt.compare(password, user.password); // Verifying password
    if (!isMatch) throw new Error("Invalid credentials");

    // Generate token
    const token = JwtUtils.generateToken({
      id: user.id,
      email: user.email,
      role: user.role as "customer" | "organizer"  // Ensure role is correctly typed
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role as "customer" | "organizer"  // Ensure role is correctly typed
      }
    };
  }
}
