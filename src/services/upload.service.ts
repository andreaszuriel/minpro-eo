import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export class UploadService {
  public async uploadFile(file: Express.Multer.File): Promise<string> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'karyaone/payslips',
          // If the file is a PDF use resource_type "raw",
          // otherwise for images, let Cloudinary decide default resource_type "image"
          resource_type:
            file.mimetype === 'application/pdf' ? 'raw' : 'image',
          public_id: file.originalname,
        },
        (error, result: UploadApiResponse | undefined) => {
          if (error) {
            console.error("Upload Error: ", error);
            return reject(error);
          }
          resolve(result?.secure_url || '');
        }
      );
      stream.end(file.buffer); // End the stream by sending the file buffer
    });
  }

  public async deleteFile(publicId: string): Promise<any> {
    return await cloudinary.uploader.destroy(publicId);
  }
}
