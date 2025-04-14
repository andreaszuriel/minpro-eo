import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { AuthenticationMiddleware } from '../middlewares/authentication.middleware';
import { ValidationMiddleware } from '../middlewares/validation.middleware';
import { z } from 'zod';

// validation schema for updating user profile
const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  password: z.string().min(6).optional(),
});

const router = Router();
const userController = new UserController();

router.get('/profile', AuthenticationMiddleware.verifyToken, userController.getProfile.bind(userController));
router.put('/profile',
  AuthenticationMiddleware.verifyToken,
  ValidationMiddleware.validate({ body: updateProfileSchema }),
  userController.updateProfile.bind(userController)
);

export class UserRouter {
  public router: Router;
  constructor() {
    this.router = router;
  }
}
