import { prisma } from '../prisma/client';
import { RegisterInput } from '../models/interface';
import bcrypt from 'bcrypt';
import { JwtUtils } from '../lib/token.config';

export class AuthService {
  private generateReferralCode(): string {
    return Math.random().toString(36).substr(2, 8);
  }

  // Register User
  public async register(data: { name: string; email: string; password: string; referralCode?: string }): Promise<{ message: string }> {
    const { name, email, password, referralCode } = data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error("User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newReferralCode = this.generateReferralCode();

    // Set role to "customer" by default
    const role = "customer";

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role, // Hardcoded to "customer"
        referralCode: newReferralCode,
        referredBy: referralCode || null
      }
    });

    // Referral logic if referral code is provided
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
      role: user.role as "customer" | "organizer"
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
}
