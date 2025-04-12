import { Request, Response, NextFunction } from 'express';

export class AuthorizationMiddleware {
  static allowRoles(allowedRole: string | string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const user = (req as any).user;
      const roles = Array.isArray(allowedRole) ? allowedRole : [allowedRole];

      if (!user || !roles.includes(user.role)) {
        return res.status(403).json({
          message: 'Forbidden : insufficient role',
        });
      }
      next();
    };
  }
}