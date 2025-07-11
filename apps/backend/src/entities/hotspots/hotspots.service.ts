import { Hotspots } from './hotspots.model';

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
        // Placeholder for actual data fetching logic from Data Team
        // This should be replaced with the actual API call or data retrieval logic
        // Expected format: { zones: [{ name: "Zone1", count: 10 }, { name: "Zone2", count: 15 }] }
        return null; // Replace with actual data fetching logic
    };


    static async fetchNewHotspotsData(): Promise<any | boolean> {

        let attempts = 0;
        const maxAttempts = 5;
        let hotspotsData: any | null = null;

        while (attempts < maxAttempts) {
            // Replace the following line with actual data fetching logic
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