import { Response } from 'express';
import { modelToResponse } from './caseTransformer';

export class ResponseHandler {
    /**
     * Send a success response
     */
    static success(res: Response, data?: any, message?: string, statusCode: number = 200): void {
        const response: any = { success: true };
        
        if (message) {
            response.message = message;
        }
        
        if (data !== undefined && data !== null) {
            response.data = modelToResponse(data);
        }
        
        res.status(statusCode).json(response);
    }

    /**
     * Handle errors with appropriate status codes
     */
    static error(error: any, res: Response, defaultMessage: string = 'Operation failed'): void {
        let statusCode = 400;
        
        // Determine appropriate status code based on error message
        if (error.message) {
            if (error.message.toLowerCase().includes('not authorized') || 
                error.message.toLowerCase().includes('unauthorized')) {
                statusCode = 403;
            } else if (error.message.toLowerCase().includes('not found') || 
                       error.message.toLowerCase().includes('no active')) {
                statusCode = 404;
            } else if (error.message.toLowerCase().includes('already exists') || 
                       error.message.toLowerCase().includes('duplicate')) {
                statusCode = 409;
            }
        }
        
        res.status(statusCode);
        throw new Error(error.message || defaultMessage);
    }

}