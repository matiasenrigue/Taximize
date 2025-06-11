export function errorHandler(err: any, req: any, res: any, next: any) {
  const status = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(status).json({
    success: false,
    error: err.message,
  });
}
