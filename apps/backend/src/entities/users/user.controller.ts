import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Ride } from '../rides/ride.model';
import { modelToResponse } from '../../shared/utils/caseTransformer';
import { ResponseHandler } from '../../shared/utils/responseHandler';

/**
 * Controller for user-related operations.
 * 
 * Handles HTTP requests for user information and profile management.
 * Currently provides endpoints for authenticated users to retrieve
 * their own profile information.
 */
export class UserController {
    /**
     * Retrieves the current authenticated user's information.
     * 
     * Returns basic user profile data excluding sensitive information
     * like passwords. The user object is pre-loaded by authentication
     * middleware before this handler executes.
     * 
     * @route GET /api/users/me
     * @access Protected (requires authentication)
     * @param req - Express request with authenticated user attached
     * @param res - Express response object
     * @returns User profile data (id, username, email, timestamps)
     * @throws 401 error if user is not authenticated
     */
    static getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        
        // User object is attached by authentication middleware, who fetched it from the database
        const user = req.user;

        if (!user) {
            res.status(401);
            throw new Error('User authentication required');
        }

        // Prepare safe user data (excluding password)
        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        ResponseHandler.success(res, userData);
    });

}