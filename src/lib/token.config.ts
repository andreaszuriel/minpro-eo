// lib/token.config.ts

import jwt from 'jsonwebtoken';

export class JwtUtils {
  static generateToken(payload: { id: number; email: string; role: 'customer' | 'organizer' }): string {
    return jwt.sign(payload, process.env.JWT_SECRET || 'your_secret_key', { expiresIn: '1h' });
  }

  static verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your_secret_key');
    } catch (err) {
      throw new Error('Invalid or expired token');
    }
  }
}
