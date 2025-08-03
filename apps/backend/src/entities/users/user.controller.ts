import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Ride } from '../rides/ride.model';
import { modelToResponse } from '../../shared/utils/caseTransformer';
import { ResponseHandler } from '../../shared/utils/responseHandler';

/**
 * Controller for user-related operations
 */
export class UserController {

    /**
     * Retrieves the current authenticated user's information excluding sensitive information
     * The user object is pre-loaded by authentication middleware before this handler executes
     * 
     * @route GET /api/users/me
     * @access Protected (requires authentication)
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

        const userData = {
            id: user.id,
            username: user.username,
            email: user.email,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };

        ResponseHandler.success(res, userData);
    });


    /**
     * Retrieves the current user's preferences
     * 
     * @route GET /api/users/preferences
     * @access Protected (requires authentication)
     * @returns User preferences object
     */
    static getPreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const user = req.user;

        if (!user) {
            res.status(401);
            throw new Error('User authentication required');
        }

        ResponseHandler.success(res, user.preferences || {});
    });


    
    /**
     * Updates the current user's preferences
     * 
     * @route PUT /api/users/preferences
     * @access Protected (requires authentication)
     * @returns Updated preferences object
     */
    static updatePreferences = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        const user = req.user;

        if (!user) {
            res.status(401);
            throw new Error('User authentication required');
        }

        // Merge new preferences with existing ones
        const updatedPreferences = {
            ...user.preferences,
            ...req.body
        };

        // Update user preferences
        user.preferences = updatedPreferences;
        await user.save();

        ResponseHandler.success(res, updatedPreferences);
    });

}