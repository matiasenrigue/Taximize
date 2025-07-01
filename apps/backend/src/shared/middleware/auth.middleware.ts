import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import asyncHandler from 'express-async-handler';
import User from '../../entities/users/user.model';

// Protect routes - verifies JWT and attaches user instance to req.user
export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
      try {
        // Verify token and extract payload
        const decoded = jwt.verify(
          token,
          process.env.ACCESS_TOKEN_SECRET!  
        ) as { id: string; iat: number; exp: number };

        // Fetch user instance by primary key
        const user = await User.findByPk(decoded.id);
        if (!user) {
          res.status(401);
          throw new Error('User not found');
        }

        // Attach user instance to request for downstream handlers
        req.user = user;
        next();
        
      } catch (error) {
        res.status(401);
        throw new Error('Not authorized, token failed');
      }
    } else {
      res.status(401);
      throw new Error('Not authorized, no token');
    }
  }
);

export default protect;
