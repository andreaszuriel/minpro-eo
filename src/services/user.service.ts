import { PrismaClient, User } from '@prisma/client';
import bcrypt from 'bcrypt';
import { UserProfile } from '../models/interface';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Retrieve a user's full profile, including transaction history.
   */
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
    if (!profile) throw new Error('User not found');
    return profile;
  }

  /**
   * Update a user's name and/or password.
   */
  public async updateUserProfile(
    userId: number,
    data: { name?: string; password?: string }
  ): Promise<UserProfile> {
    const updateData: Record<string, any> = {};
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

  /**
   * Update only the user's avatar/image URL.
   */
  public async updateUserImage(
    userId: number,
    imageUrl: string
  ): Promise<Pick<User, 'id' | 'email' | 'name' | 'image'>> {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { image: imageUrl },
      select: { id: true, email: true, name: true, image: true },
    });
    return updated;
  }
}
