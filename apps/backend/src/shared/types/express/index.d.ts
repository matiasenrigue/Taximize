// File with custom type definitions for Express

import { User } from '../../models/userModel';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
