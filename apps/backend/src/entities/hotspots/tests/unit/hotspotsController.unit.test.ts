import { Request, Response, NextFunction } from 'express';
import { HotspotsController } from '../../hotspots.controller';
import { HotspotsService } from '../../hotspots.service';
import { sequelize } from '../../../../shared/config/db';

// Mock HotspotsService
jest.mock('../../hotspots.service');

// Mock response object
const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

// Mock next function
const mockNext = jest.fn() as NextFunction;

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


describe('HotspotsController Unit Tests', () => {
    describe('getHotspots', () => {
        it('should return hotspots data when service returns data successfully', async () => {
            const mockHotspotsData = {
                timestamp: new Date(),
                zones: [
                    { name: "Zone1", count: 10 },
                    { name: "Zone2", count: 15 }
                ]
            };

            const req = {} as Request;
            const res = mockResponse();

            // Mock the service method
            (HotspotsService.getHotspotsData as jest.Mock).mockResolvedValue(mockHotspotsData);

            await HotspotsController.getHotspots(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockHotspotsData,
            });
        });


        it('should return 500 error when service throws an error', async () => {
            const req = {} as Request;
            const res = mockResponse();

            // Mock the service method to throw an error
            (HotspotsService.getHotspotsData as jest.Mock).mockRejectedValue(
                new Error('Failed to retrieve hotspots data')
            );

            await HotspotsController.getHotspots(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to retrieve hotspots data',
                data: null,
            });
        });


        it('should handle non-Error objects thrown by service', async () => {
            const req = {} as Request;
            const res = mockResponse();

            // Mock the service method to throw a non-Error object
            (HotspotsService.getHotspotsData as jest.Mock).mockRejectedValue('string error');

            await HotspotsController.getHotspots(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to retrieve hotspots data',
                data: null,
            });
        });


        it('should call HotspotsService.getHotspotsData exactly once', async () => {
            const req = {} as Request;
            const res = mockResponse();

            (HotspotsService.getHotspotsData as jest.Mock).mockResolvedValue({});

            await HotspotsController.getHotspots(req, res, mockNext);

            expect(HotspotsService.getHotspotsData).toHaveBeenCalledTimes(1);
            expect(HotspotsService.getHotspotsData).toHaveBeenCalledWith();
        });


        it('should return empty data object when service returns empty data', async () => {
            const req = {} as Request;
            const res = mockResponse();

            (HotspotsService.getHotspotsData as jest.Mock).mockResolvedValue({});

            await HotspotsController.getHotspots(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
            });
        });


        it('should return null data when service returns null', async () => {
            const req = {} as Request;
            const res = mockResponse();

            (HotspotsService.getHotspotsData as jest.Mock).mockResolvedValue(null);

            await HotspotsController.getHotspots(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: null,
            });
        });
    });
});