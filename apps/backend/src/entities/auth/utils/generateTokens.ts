import jwt from 'jsonwebtoken';

export const generateAccessToken = (id: string): string => {
    return jwt.sign({ id }, process.env.ACCESS_TOKEN_SECRET!, {
        expiresIn: '15m',
    });
};

export const generateRefreshToken = (id: string): string => {
    return jwt.sign({ id }, process.env.REFRESH_TOKEN_SECRET!, {
        expiresIn: '7d',
    });
};
