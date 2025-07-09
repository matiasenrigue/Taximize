// File with custom type definitions for Express

import User from '../../entities/users/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
