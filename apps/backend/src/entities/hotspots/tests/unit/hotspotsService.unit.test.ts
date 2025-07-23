import { HotspotsService } from '../../hotspots.service';
import { Hotspots } from '../../hotspots.model';
import { sequelize } from '../../../../shared/config/db';

jest.mock('../../hotspots.model', () => ({
    Hotspots: {
        findOne: jest.fn(),
        findAll: jest.fn(),
        create: jest.fn(),
    }
}));

beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    await sequelize.sync({ force: true });
});

afterEach(() => {
    jest.clearAllMocks();
});

afterAll(async () => {
    await sequelize.close();
});


describe('HotspotsService', () => {

    describe('isHotspotDataRecent', () => {

        it('returns data for recent hotspots', async () => {
            const mockData = { zones: [{ name: "Zone1", count: 10 }] };
            const now = new Date();
            
            const mockHotspot = {
                data: mockData,
                createdAt: now,
                created_at: now // stupid sequelize sometimes uses snake_case
            };

            (Hotspots.findOne as jest.Mock).mockResolvedValue(mockHotspot);

            const result = await HotspotsService.isHotspotDataRecent();

            expect(result).toEqual(mockData);
            expect(Hotspots.findOne).toHaveBeenCalledWith({
                order: [['createdAt', 'DESC']],
            });
        });


        it('handles missing data', async () => {
            (Hotspots.findOne as jest.Mock).mockResolvedValue(null);

            const result = await HotspotsService.isHotspotDataRecent();

            expect(result).toBeNull(); // no hotspots? no problem
        });


        it('rejects old data', async () => {
            const oldData = { zones: [{ name: "Zone1", count: 10 }] };
            const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
            
            (Hotspots.findOne as jest.Mock).mockResolvedValue({
                data: oldData,
                createdAt: twoHoursAgo,
                created_at: twoHoursAgo
            });

            const result = await HotspotsService.isHotspotDataRecent();

            expect(result).toBeNull();
        });


        // edge case - exactly 59 minutes
        it('accepts data at 59 minutes', async () => {
            const data = { zones: [{ name: "Zone1", count: 10 }] };
            const fiftyNineMinutesAgo = new Date(Date.now() - 59 * 60 * 1000);
            
            (Hotspots.findOne as jest.Mock).mockResolvedValue({
                data,
                createdAt: fiftyNineMinutesAgo,
                created_at: fiftyNineMinutesAgo
            });

            const result = await HotspotsService.isHotspotDataRecent();

            expect(result).toEqual(data); // just under the wire!
        });
    });




    describe('fetchNewHotspotsData', () => {

        it('saves new data from API', async () => {
            const apiData = { zones: [{ name: "Zone1", count: 10 }, { name: "Zone2", count: 15 }] };
            
            jest.spyOn(HotspotsService, 'hotspotsApiCall').mockResolvedValueOnce(apiData);
            (Hotspots.create as jest.Mock).mockResolvedValue({
                id: 'abc123',
                data: apiData,
                createdAt: new Date()
            });

            const result = await HotspotsService.fetchNewHotspotsData();

            expect(result).toEqual(apiData);
            expect(HotspotsService.hotspotsApiCall).toHaveBeenCalled(); // api was hit
            expect(Hotspots.create).toHaveBeenCalledWith({ data: apiData }); // data was saved
        });


        it('keeps trying if API fails', async () => {
            const goodData = { zones: [{ name: "Zone1", count: 10 }] };
            
            // fail fail fail fail SUCCESS!
            jest.spyOn(HotspotsService, 'hotspotsApiCall')
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(null)
                .mockResolvedValueOnce(goodData);

            (Hotspots.create as jest.Mock).mockResolvedValue({ id: '123', data: goodData });

            const result = await HotspotsService.fetchNewHotspotsData();

            expect(result).toEqual(goodData);
            expect(HotspotsService.hotspotsApiCall).toHaveBeenCalledTimes(5); // persistence pays off
        });


        it('gives up after 5 tries', async () => {
            jest.spyOn(HotspotsService, 'hotspotsApiCall').mockResolvedValue(null);

            const result = await HotspotsService.fetchNewHotspotsData();

            expect(result).toBe(false); 
            expect(HotspotsService.hotspotsApiCall).toHaveBeenCalledTimes(5);
            expect(Hotspots.create).not.toHaveBeenCalled(); // nothing to save
        });
    });


    describe('retrieveCachedHotspotsData', () => {

        it('gets the latest cached entry', async () => {
            const cachedData = { zones: [{ name: "Zone1", count: 10 }] };
            
            (Hotspots.findAll as jest.Mock).mockResolvedValue([{
                data: cachedData,
                createdAt: new Date()
            }]);

            const result = await HotspotsService.retrieveCachedHotspotsData();

            expect(result).toEqual(cachedData);
            expect(Hotspots.findAll).toHaveBeenCalledWith({
                order: [['createdAt', 'DESC']],
                limit: 1,
            });
        });

        it('returns false when cache is empty', async () => {
            (Hotspots.findAll as jest.Mock).mockResolvedValue([]);

            expect(await HotspotsService.retrieveCachedHotspotsData()).toBe(false);
        });
    });


    describe('getHotspotsData - the main method', () => {
        it('uses recent data if available', async () => {
            const freshData = { zones: [{ name: "Zone1", count: 10 }] };
            jest.spyOn(HotspotsService, 'isHotspotDataRecent').mockResolvedValue(freshData);
            jest.spyOn(HotspotsService, 'fetchNewHotspotsData');

            const result = await HotspotsService.getHotspotsData();

            expect(result).toEqual(freshData);
            expect(HotspotsService.fetchNewHotspotsData).not.toHaveBeenCalled(); // why fetch when we have fresh?
        });


        it('fetches new data when needed', async () => {
            const newData = { zones: [{ name: "Downtown", count: 25 }] };
            jest.spyOn(HotspotsService, 'isHotspotDataRecent').mockResolvedValue(null); // nothing recent
            jest.spyOn(HotspotsService, 'fetchNewHotspotsData').mockResolvedValue(newData);

            const result = await HotspotsService.getHotspotsData();

            expect(result).toEqual(newData);
        });


        it('falls back to cache when API is down', async () => {
            const oldButGold = { zones: [{ name: "Zone1", count: 10 }] };
            jest.spyOn(HotspotsService, 'isHotspotDataRecent').mockResolvedValue(null);
            jest.spyOn(HotspotsService, 'fetchNewHotspotsData').mockResolvedValue(false); // api failed
            jest.spyOn(HotspotsService, 'retrieveCachedHotspotsData').mockResolvedValue(oldButGold);

            const result = await HotspotsService.getHotspotsData();

            expect(result).toEqual(oldButGold); // better than nothing
        });

        // worst case scenario  
        it('throws when completely out of options', async () => {
            jest.spyOn(HotspotsService, 'isHotspotDataRecent').mockResolvedValue(null);
            jest.spyOn(HotspotsService, 'fetchNewHotspotsData').mockResolvedValue(false);
            jest.spyOn(HotspotsService, 'retrieveCachedHotspotsData').mockResolvedValue(false);

            // this is bad
            await expect(HotspotsService.getHotspotsData()).rejects.toThrow('No hotspots data available');
        });
    });
});