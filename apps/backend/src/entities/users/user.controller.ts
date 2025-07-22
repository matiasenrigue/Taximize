import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Ride } from '../rides/ride.model';
import { modelToResponse } from '../../shared/utils/caseTransformer';
import { ResponseHandler } from '../../shared/utils/responseHandler';

export class UserController {
    // @desc    Get current user information
    // @route   GET /api/users/me
    // @access  Protected
    static getCurrentUser = asyncHandler(async (req: Request, res: Response): Promise<void> => {
        
        // User was already fetched from the DB by the middleware
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

}