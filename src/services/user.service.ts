import { PrismaClient } from '@prisma/client';
import { UserProfile } from '../models/interface';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserService {
  public async getUserProfile(userId: number): Promise<UserProfile> {
    const profile = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        referralCode: true,
        createdAt: true,
        transactions: {
          select: {
            id: true,
            userId: true,
            eventId: true,
            ticketQuantity: true,
            finalPrice: true,
            status: true,
            paymentProof: true,
            createdAt: true,
          },
        },
      },
    });
    if (!profile) throw new Error("User not found");
    return profile;
  }

  public async updateUserProfile(userId: number, data: { name?: string; password?: string; }): Promise<UserProfile> {
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }
    const updatedProfile = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        points: true,
        referralCode: true,
        createdAt: true,
        transactions: {
          select: {
            id: true,
            userId: true,
            eventId: true,
            ticketQuantity: true,
            finalPrice: true,
            status: true,
            paymentProof: true,
            createdAt: true,
          },
        },
      },
    });
    return updatedProfile;
  }
}
