import { Request, Response, NextFunction } from 'express';

export const authorize =
  (...roles: string[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    // @ts-ignore
    if (!roles.includes(req.user.role)) {
      res.status(403);
      throw new Error('Forbidden: insufficient rights');
    }
    next();
  };
