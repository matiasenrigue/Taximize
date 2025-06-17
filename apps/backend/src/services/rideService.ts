import { Ride } from '../models/rideModel';
import { Shift } from '../models/shiftModel';
import { ShiftService } from './shiftService';
import { MlStub } from '../utils/mlStub';
import { RideCalculator } from '../utils/rideCalculator';
import { Op } from 'sequelize';

interface RideCoordinates {
  startLat: number;
  startLng: number;
  destLat: number;
  destLng: number;
}

interface OverrideDestination {
  lat: number;
  lng: number;
}

export class RideService {
  static async hasActiveRide(driverId: string): Promise<boolean> {
    // Get active shift for driver first
    const activeShift = await Shift.findOne({
      where: { 
        driver_id: driverId,
        shift_end: null
      }
    });

    if (!activeShift) return false;

    const activeRide = await Ride.findOne({
      where: { 
        shift_id: activeShift.id,
        end_time: null 
      },
      order: [['start_time', 'DESC']]
    });
    
    return !!activeRide;
  }

  static async canStartRide(driverId: string): Promise<boolean> {
    // Check if driver is available (has active shift and not paused)
    const isAvailable = await ShiftService.driverIsAvailable(driverId);
    if (!isAvailable) {
      return false;
    }

    // Check if driver already has an active ride
    const hasActive = await this.hasActiveRide(driverId);
    return !hasActive;
  }

  static async evaluateRide(startLat: number, startLng: number, destLat: number, destLng: number): Promise<number> {
    // Validate coordinates
    this.validateCoordinates(startLat, startLng, destLat, destLng);
    
    // Use ML stub to get random score
    return MlStub.getRandomScore();
  }

  static async startRide(driverId: string, shiftId: string, coords: RideCoordinates): Promise<any> {
    // Validate coordinates
    this.validateCoordinates(coords.startLat, coords.startLng, coords.destLat, coords.destLng);

    // Check if driver can start ride
    const canStart = await this.canStartRide(driverId);
    if (!canStart) {
      throw new Error('Cannot start ride—either no active shift or another ride in progress');
    }

    // Get predicted score
    const predictedScore = await this.evaluateRide(coords.startLat, coords.startLng, coords.destLat, coords.destLng);

    // Create new ride
    const ride = await Ride.create({
      shift_id: shiftId,
      driver_id: driverId,
      start_latitude: coords.startLat,
      start_longitude: coords.startLng,
      destination_latitude: coords.destLat,
      destination_longitude: coords.destLng,
      start_time: new Date(),
      predicted_score: predictedScore,
      end_time: null,
      earning_cents: null,
      earning_per_min: null,
      distance_km: null
    });

    return {
      rideId: ride.id,
      startTime: ride.start_time.getTime(),
      predicted_score: predictedScore
    };
  }

  static async endRide(rideId: string, fareCents: number, actualDistanceKm: number): Promise<any> {
    // Find the active ride
    const ride = await Ride.findByPk(rideId);
    
    if (!ride) {
      throw new Error('Ride not found');
    }

    if (ride.end_time !== null) {
      throw new Error('Ride is already ended');
    }

    const endTime = new Date();
    const totalTimeMs = endTime.getTime() - ride.start_time.getTime();
    const earningPerMin = Math.round((fareCents / (totalTimeMs / (1000 * 60))));

    // Update the ride
    await ride.update({
      end_time: endTime,
      earning_cents: fareCents,
      earning_per_min: earningPerMin,
      distance_km: actualDistanceKm
    });

    return {
      rideId: ride.id,
      total_time_ms: totalTimeMs,
      distance_km: actualDistanceKm,
      earning_cents: fareCents,
      earning_per_min: earningPerMin
    };
  }

  static async getRideStatus(driverId: string, overrideDest?: OverrideDestination): Promise<any> {
    // Get active shift for driver first
    const activeShift = await Shift.findOne({
      where: { 
        driver_id: driverId,
        shift_end: null
      }
    });

    if (!activeShift) return null;

    // Find active ride for driver
    const activeRide = await Ride.findOne({
      where: { 
        shift_id: activeShift.id,
        end_time: null 
      },
      order: [['start_time', 'DESC']]
    });

    if (!activeRide) {
      return null;
    }

    const currentTime = new Date();
    const elapsedTimeMs = currentTime.getTime() - activeRide.start_time.getTime();

    // Use override destination if provided, otherwise use original
    const destLat = overrideDest ? overrideDest.lat : activeRide.destination_latitude;
    const destLng = overrideDest ? overrideDest.lng : activeRide.destination_longitude;

    // Calculate distance and estimated fare
    const distanceKm = RideCalculator.computeDistanceKm(
      activeRide.start_latitude,
      activeRide.start_longitude,
      destLat,
      destLng
    );

    const estimatedFareCents = Math.round(RideCalculator.computeFare(elapsedTimeMs, distanceKm));

    return {
      rideId: activeRide.id,
      start_latitude: activeRide.start_latitude,
      start_longitude: activeRide.start_longitude,
      current_destination_latitude: destLat,
      current_destination_longitude: destLng,
      elapsed_time_ms: elapsedTimeMs,
      distance_km: distanceKm,
      estimated_fare_cents: estimatedFareCents
    };
  }

  static async manageExpiredRides(): Promise<void> {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    // Find rides that started more than 4 hours ago and are still active
    const expiredRides = await Ride.findAll({
      where: {
        start_time: { [Op.lt]: fourHoursAgo },
        end_time: null
      }
    });

    // End each expired ride with duration 0 (nullify earnings)
    for (const ride of expiredRides) {
      await ride.update({
        end_time: new Date(),
        earning_cents: 0,
        earning_per_min: 0,
        distance_km: 0
      });
    }
  }

  private static validateCoordinates(startLat: number, startLng: number, destLat: number, destLng: number): void {
    if (startLat < -90 || startLat > 90 || destLat < -90 || destLat > 90) {
      throw new Error('Invalid latitude provided');
    }
    
    if (startLng < -180 || startLng > 180 || destLng < -180 || destLng > 180) {
      throw new Error('Invalid longitude provided');
    }
  }
} 