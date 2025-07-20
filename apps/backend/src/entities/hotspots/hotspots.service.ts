import { Hotspots } from './hotspots.model';
import { getHotspotPredictions } from '../../shared/utils/dataApiClient';
import moment from 'moment';

export class HotspotsService {
        
        static async isHotspotDataRecent(): Promise<any | null> {
                const now: Date = new Date();
                const lastHour: Date = new Date(now.getTime() - 60 * 60 * 1000);

                const latestHotspot: Hotspots | null = await Hotspots.findOne({
                        order: [['createdAt', 'DESC']],
                });
                
                // If no hotspots are found, return null
                if (!latestHotspot) {
                        return null;
                }

                if (latestHotspot.createdAt >= lastHour) {
                        return latestHotspot.data;
                }
                
                return null; // Data is not recent
        };


        static async hotspotsApiCall(): Promise<any | null> { 
                try {
                        // Get current time in UTC (Flask API will convert to NYC time)
                        // Code: https://stackoverflow.com/questions/33599768/what-is-the-yyyy-mm-ddthhmmss-sssz-date-timezone-formatting-and-how-can-i-rep
                        const formattedTime = moment.utc().toISOString();                        
                        
                        // Get hotspot predictions from Flask API
                        const predictions = await getHotspotPredictions(formattedTime);
                        
                        // Transform the data to match expected format
                        const transformedData = {
                                zones: predictions.map(pred => ({
                                        name: pred.pickup_zone,
                                        locationId: pred.location_id,
                                        count: Math.round(pred.predicted_trip_count)
                                }))
                        };
                        
                        return transformedData;
                } catch (error) {
                        console.error('Error fetching hotspot predictions:', error);
                        return null;
                }
        };


        static async fetchNewHotspotsData(): Promise<any | boolean> {

                let attempts = 0;
                const maxAttempts = 5;
                let hotspotsData: any | null = null;

                while (attempts < maxAttempts) {
                        hotspotsData = await this.hotspotsApiCall(); 

                        if (hotspotsData) {
                                break;
                        }

                        attempts++;
                }

                if (!hotspotsData) {
                        console.error('Failed to fetch hotspots data after multiple attempts');
                        return false;
                }

                const newHotspots: Hotspots = await Hotspots.create({
                        data: hotspotsData,
                });
        
                return newHotspots.data;
        };


        static async retrieveCachedHotspotsData(): Promise<any | boolean> {
                
                const cachedHotspots: Hotspots[] = await Hotspots.findAll({
                        order: [['createdAt', 'DESC']],
                        limit: 1, // Get the most recent cached data
                });

                return cachedHotspots.length === 0 ? false : cachedHotspots[0].data;
        
        };


        static async getHotspotsData(): Promise<any> {
                const recentData = await this.isHotspotDataRecent();
                
                if (!recentData) {
                        const newHotspotsData: any | boolean = await this.fetchNewHotspotsData();

                        if (newHotspotsData === false) {
                                // If fetching new data fails, try to get cached data
                                const cachedData = await this.retrieveCachedHotspotsData();

                                if (cachedData === false) {
                                        throw new Error('No hotspots data available');
                                }
                                
                                return cachedData;
                        }
                        return newHotspotsData;
                }
                
                // Return the recent data
                return recentData;
        };
}