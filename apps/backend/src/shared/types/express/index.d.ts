/**
 * Reference: https://blog.logrocket.com/extend-express-request-object-typescript/
 */

import User from '../../entities/users/user.model';

// We use 'declare global' to extend types that exist in the global namespace
declare global {

    // Express is a namespace that contains all Express types
    namespace Express {

        // Extend the existing Request interface
        interface Request {

            // Added by protect middleware after JWT verification
            user?: User;
            
            // Added by requireDriver middleware for driver-specific routes
            driverId?: string;
        }
    }
}
