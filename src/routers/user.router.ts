// src/routers/user.router.ts
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { upload } from '../middlewares/upload.middleware';  // existing multer middleware
import { z } from 'zod';

const router = Router();
const userController = new UserController();

// GET & PUT profile (existing)
router.get(
  '/profile',
  AuthenticationMiddleware.verifyToken,
  userController.getProfile.bind(userController)
);
router.put(
  '/profile',
  AuthenticationMiddleware.verifyToken,
  ValidationMiddleware.validate({ body: z.object({
    name:     z.string().min(1).optional(),
    password: z.string().min(6).optional()
  }) }),
  userController.updateProfile.bind(userController)
);

// NEW: profile image upload
router.post(
  '/profile/image',
  AuthenticationMiddleware.verifyToken,
  upload.single('image'),
  userController.uploadProfileImage.bind(userController)
);

export class UserRouter {
  public router = router;
}
