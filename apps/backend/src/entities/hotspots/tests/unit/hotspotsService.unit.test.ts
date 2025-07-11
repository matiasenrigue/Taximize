import { HotspotsService } from '../../hotspots.service';
import { Hotspots } from '../../hotspots.model';
import { sequelize } from '../../../../shared/config/db';

// Mock the Hotspots model
jest.mock('../../hotspots.model', () => ({
  Hotspots: {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  }
}));

// Set up test database before running tests
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

describe('HotspotsService Unit Tests', () => {
  describe('isHotspotDataRecent', () => {
    it('should return data when hotspot was created within the last hour', async () => {
      const mockHotspotData = { zones: [{ name: "Zone1", count: 10 }] };
      const recentDate = new Date();
      
      const mockHotspot = {
        data: mockHotspotData,
        createdAt: recentDate,
        created_at: recentDate // Handle both naming conventions
      };

      (Hotspots.findOne as jest.Mock).mockResolvedValue(mockHotspot);

      const result = await HotspotsService.isHotspotDataRecent();

      expect(result).toEqual(mockHotspotData);
      expect(Hotspots.findOne).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
      });
    });

    it('should return null when no hotspots exist', async () => {
      (Hotspots.findOne as jest.Mock).mockResolvedValue(null);

      const result = await HotspotsService.isHotspotDataRecent();

      expect(result).toBeNull();
    });

    it('should return null when hotspot is older than 1 hour', async () => {
      const mockHotspotData = { zones: [{ name: "Zone1", count: 10 }] };
      const oldDate = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
      
      const mockHotspot = {
        data: mockHotspotData,
        createdAt: oldDate,
        created_at: oldDate
      };

      (Hotspots.findOne as jest.Mock).mockResolvedValue(mockHotspot);

      const result = await HotspotsService.isHotspotDataRecent();

      expect(result).toBeNull();
    });

    it('should return data when hotspot is exactly 59 minutes old', async () => {
      const mockHotspotData = { zones: [{ name: "Zone1", count: 10 }] };
      const almostHourOld = new Date(Date.now() - 59 * 60 * 1000); // 59 minutes ago
      
      const mockHotspot = {
        data: mockHotspotData,
        createdAt: almostHourOld,
        created_at: almostHourOld
      };

      (Hotspots.findOne as jest.Mock).mockResolvedValue(mockHotspot);

      const result = await HotspotsService.isHotspotDataRecent();

      expect(result).toEqual(mockHotspotData);
    });
  });

  describe('hotspotsApiCall', () => {
    it('should return null as placeholder', async () => {
      const result = await HotspotsService.hotspotsApiCall();
      expect(result).toBeNull();
    });
  });

  describe('fetchNewHotspotsData', () => {
    it('should create new hotspot when API call returns data', async () => {
      const mockApiData = { zones: [{ name: "Zone1", count: 10 }, { name: "Zone2", count: 15 }] };
      const mockCreatedHotspot = {
        id: 'test-id',
        data: mockApiData,
        createdAt: new Date()
      };

      // Mock the API call to return data on first attempt
      jest.spyOn(HotspotsService, 'hotspotsApiCall').mockResolvedValueOnce(mockApiData);
      (Hotspots.create as jest.Mock).mockResolvedValue(mockCreatedHotspot);

      const result = await HotspotsService.fetchNewHotspotsData();

      expect(result).toEqual(mockApiData);
      expect(HotspotsService.hotspotsApiCall).toHaveBeenCalledTimes(1);
      expect(Hotspots.create).toHaveBeenCalledWith({ data: mockApiData });
    });

    it('should retry up to 5 times when API call fails', async () => {
      // Mock the API call to return null 4 times, then data on 5th attempt
      const mockApiData = { zones: [{ name: "Zone1", count: 10 }, { name: "Zone2", count: 15 }] };
      const mockCreatedHotspot = {
        id: 'test-id',
        data: mockApiData,
        createdAt: new Date()
      };

      jest.spyOn(HotspotsService, 'hotspotsApiCall')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockApiData);

      (Hotspots.create as jest.Mock).mockResolvedValue(mockCreatedHotspot);

      const result = await HotspotsService.fetchNewHotspotsData();

      expect(result).toEqual(mockApiData);
      expect(HotspotsService.hotspotsApiCall).toHaveBeenCalledTimes(5);
    });

    it('should return false after 5 failed attempts', async () => {
      jest.spyOn(HotspotsService, 'hotspotsApiCall').mockResolvedValue(null);

      const result = await HotspotsService.fetchNewHotspotsData();

      expect(result).toBe(false);
      expect(HotspotsService.hotspotsApiCall).toHaveBeenCalledTimes(5);
      expect(Hotspots.create).not.toHaveBeenCalled();
    });

    it('should log error when all attempts fail', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(HotspotsService, 'hotspotsApiCall').mockResolvedValue(null);

      await HotspotsService.fetchNewHotspotsData();

      expect(consoleSpy).toHaveBeenCalledWith('Failed to fetch hotspots data after multiple attempts');
      consoleSpy.mockRestore();
    });
  });

  describe('retrieveCachedHotspotsData', () => {
    it('should return most recent cached data when available', async () => {
      const mockHotspotData = { zones: [{ name: "Zone1", count: 10 }] };
      const mockHotspots = [{
        data: mockHotspotData,
        createdAt: new Date()
      }];

      (Hotspots.findAll as jest.Mock).mockResolvedValue(mockHotspots);

      const result = await HotspotsService.retrieveCachedHotspotsData();

      expect(result).toEqual(mockHotspotData);
      expect(Hotspots.findAll).toHaveBeenCalledWith({
        order: [['createdAt', 'DESC']],
        limit: 1,
      });
    });

    it('should return false when no cached data exists', async () => {
      (Hotspots.findAll as jest.Mock).mockResolvedValue([]);

      const result = await HotspotsService.retrieveCachedHotspotsData();

      expect(result).toBe(false);
    });
  });

  describe('getHotspotsData', () => {
    it('should return recent data without fetching new data', async () => {
      const mockRecentData = { zones: [{ name: "Zone1", count: 10 }] };
      jest.spyOn(HotspotsService, 'isHotspotDataRecent').mockResolvedValue(mockRecentData);
      jest.spyOn(HotspotsService, 'fetchNewHotspotsData');

      const result = await HotspotsService.getHotspotsData();

      expect(result).toEqual(mockRecentData);
      expect(HotspotsService.isHotspotDataRecent).toHaveBeenCalled();
      expect(HotspotsService.fetchNewHotspotsData).not.toHaveBeenCalled();
    });

    it('should fetch new data when no recent data exists', async () => {
      const mockNewData = { zones: [{ name: "Zone1", count: 10 }] };
      jest.spyOn(HotspotsService, 'isHotspotDataRecent').mockResolvedValue(null);
      jest.spyOn(HotspotsService, 'fetchNewHotspotsData').mockResolvedValue(mockNewData);

      const result = await HotspotsService.getHotspotsData();

      expect(result).toEqual(mockNewData);
      expect(HotspotsService.fetchNewHotspotsData).toHaveBeenCalled();
    });

    it('should return cached data when fetching new data fails', async () => {
      const mockCachedData = { zones: [{ name: "Zone1", count: 10 }] };
      jest.spyOn(HotspotsService, 'isHotspotDataRecent').mockResolvedValue(null);
      jest.spyOn(HotspotsService, 'fetchNewHotspotsData').mockResolvedValue(false);
      jest.spyOn(HotspotsService, 'retrieveCachedHotspotsData').mockResolvedValue(mockCachedData);

      const result = await HotspotsService.getHotspotsData();

      expect(result).toEqual(mockCachedData);
      expect(HotspotsService.retrieveCachedHotspotsData).toHaveBeenCalled();
    });

    it('should throw error when no data is available at all', async () => {
      jest.spyOn(HotspotsService, 'isHotspotDataRecent').mockResolvedValue(null);
      jest.spyOn(HotspotsService, 'fetchNewHotspotsData').mockResolvedValue(false);
      jest.spyOn(HotspotsService, 'retrieveCachedHotspotsData').mockResolvedValue(false);

      await expect(HotspotsService.getHotspotsData()).rejects.toThrow('No hotspots data available');
    });
  });
});