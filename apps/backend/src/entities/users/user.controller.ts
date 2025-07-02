import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import { Ride } from '../rides/ride.model';

export class UserController {
  // @desc    Get user statistics
  // @route   GET /api/users/me/stats
  // @access  Protected
  static getUserStats = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401);
      throw new Error('User authentication required');
    }

    // Get total rides count for the user
    const totalRides = await Ride.count({
      where: { driver_id: userId }
    });

    res.status(200).json({
      total_rides: totalRides
    });
  });
}