import { Request, Response, NextFunction } from 'express';
import { HotspotsController } from '../../hotspots.controller';
import { HotspotsService } from '../../hotspots.service';
import { sequelize } from '../../../../shared/config/db';

jest.mock('../../hotspots.service');

// Helper to create mock response
const mockResponse = () => {
    const res = {} as Response;
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
};

const mockNext = jest.fn() as NextFunction;

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


describe('HotspotsController', () => {

    describe('getHotspots', () => {

        it('returns hotspots data on success', async () => {
            const mockData = {
                timestamp: new Date(),
                zones: [
                    { name: "Zone1", count: 10 },
                    { name: "Zone2", count: 15 }
                ]
            };

            const req = {} as Request;
            const res = mockResponse();

            (HotspotsService.getHotspotsData as jest.Mock).mockResolvedValue(mockData);

            await HotspotsController.getHotspots(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: mockData,
            });
        });


        it('handles service errors gracefully', async () => {
            const req = {} as Request;
            const res = mockResponse();

            // Simulate failure
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


        it('handles weird error types', async () => {
            const req = {} as Request;
            const res = mockResponse();

            // sometimes services throw strings instead of errors
            (HotspotsService.getHotspotsData as jest.Mock).mockRejectedValue('string error');

            await HotspotsController.getHotspots(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Failed to retrieve hotspots data',
                data: null,
            });
        });



        it('works with empty response', async () => {
            const req = {} as Request;
            const res = mockResponse();

            (HotspotsService.getHotspotsData as jest.Mock).mockResolvedValue({});

            await HotspotsController.getHotspots(req, res, mockNext);

            expect(res.status).toHaveBeenCalledWith(200); // still 200 even if empty
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                data: {},
            });
        });
    });
});