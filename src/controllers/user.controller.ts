import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  public async getProfile(req: Request, res: Response): Promise<void> {
    try {
      // @ts-ignore - asumsikan middleware autentikasi menambahkan properti "user" ke req
      const userId = req.user.id;
      const profile = await this.userService.getUserProfile(userId);
      res.status(200).json(profile);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }

  public async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      // @ts-ignore 
      const userId = req.user.id;
      const updatedProfile = await this.userService.updateUserProfile(userId, req.body);
      res.status(200).json(updatedProfile);
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ message: "Server error" });
    }
  }
}
