import { Router } from 'express';
import { UploadController } from '../controllers/upload.controller';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();
const uploadController = new UploadController();

// Protected endpoint: only authenticated users can upload files
router.post(
  '/',
  AuthenticationMiddleware.verifyToken,
  upload.single('file'), // Use the multer middleware that we set up
  uploadController.uploadFile.bind(uploadController)
);

export class UploadRouter {
  public router: Router;
  constructor() {
    this.router = router;
  }
}
