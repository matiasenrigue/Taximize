/**
 * Global error handler middleware
 * 
 * Source: https://stackoverflow.com/questions/60923117/prevent-stack-trace-leak-in-production-in-nodejs-application
 * In production you should not send stack trace to the client... it's a security risk
 * 
 * Source: https://stackoverflow.com/questions/66390497/express-error-handling-middleware-for-production-and-development
 * Basic pattern for environment-specific error handling
 */
export function errorHandler(err: any, req: any, res: any, next: any) {
    const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(status).json({
        success: false,
        error: (!isDevelopment && status === 500) ? 'Internal server error' : err.message,
        ...(isDevelopment && { stack: err.stack })
    });
}
