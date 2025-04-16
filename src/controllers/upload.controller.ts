import { Request, Response } from 'express';
import { UploadService } from '../services/upload.service';

export class UploadController {
  private uploadService: UploadService;

  constructor() {
    this.uploadService = new UploadService();
  }

  public async uploadFile(req: Request, res: Response): Promise<void> {
    try {
      // Expecting file from multer middleware at req.file
      const file = req.file;
      if (!file) {
        res.status(400).json({ message: "No file provided" });
        return;
      }
      const url = await this.uploadService.uploadFile(file);
      res.status(200).json({ url });
      return;
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ message: "Image upload failed" });
      return;
    }
  }
}
