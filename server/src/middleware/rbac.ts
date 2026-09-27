import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models/User.js';

export const authorize = (allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized. User not authenticated.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        message: `Forbidden. Role '${req.user.role}' does not have sufficient permissions.`,
      });
      return;
    }

    next();
  };
};
