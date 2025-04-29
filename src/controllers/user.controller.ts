import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import path from 'path';
import fs from 'fs';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * GET /api/user/profile
   * Retrieve the current user's profile.
   */
  public async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // @ts-ignore - assume authentication middleware sets req.user
      const userId: number = req.user.id;
      const profile = await this.userService.getUserProfile(userId);
      res.status(200).json(profile);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * PUT /api/user/profile
   * Update the current user's name and/or password.
   */
  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      // @ts-ignore
      const userId: number = req.user.id;
      const updatedProfile = await this.userService.updateUserProfile(userId, req.body);
      res.status(200).json(updatedProfile);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  /**
   * POST /api/user/profile/image
   * Upload and set a new profile image for the user.
   * Uses multer middleware to populate req.file.
   */
  public async uploadProfileImage(req: Request, res: Response): Promise<void> {
    try {
      // @ts-ignore
      const userId: number = req.user.id;
      // multer places the file buffer in req.file
      const file = (req as any).file;
      if (!file) {
        res.status(400).json({ message: 'No file uploaded' });
        return;
      }

      // Ensure upload directory exists
      const uploadDir = path.join(__dirname, '../../uploads/profile');
      await fs.promises.mkdir(uploadDir, { recursive: true });

      // Generate unique filename
      const ext = path.extname(file.originalname) || '.png';
      const filename = `profile_${userId}_${Date.now()}${ext}`;
      const filePath = path.join(uploadDir, filename);

      // Save file to disk
      await fs.promises.writeFile(filePath, file.buffer);

      // URL/path to store in DB
      const imageUrl = `/uploads/profile/${filename}`;

      // Update user record
      const updated = await this.userService.updateUserImage(userId.toString(), imageUrl);
      res.status(200).json(updated);
    } catch (error: any) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ message: 'Failed to upload image' });
    }
  }
}
