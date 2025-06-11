import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../utils/generateTokens';
import jwt from 'jsonwebtoken';



// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = asyncHandler(async (req: Request, res: Response) => {
  
  console.log('Received signup request:', req.body);
  
  const { email, username, password } = req.body;
  if (!email || !username || !password) {
    res.status(400);
    throw new Error('Please provide all fields');
  }

  const exists = await User.findOne({ where: { email } });
  if (exists) {
    res
      .status(400)
      .json({ success: false, error: 'User with this email already exists' });
    return;
  }

  const user = await User.create({ email, username, password });
  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: { userId: user.id, username: user.username },
  });
});


// @desc    Authenticate user & get token
// @route   POST /api/auth/signin
// @access  Public
export const signin = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await User.findOne({ where: { email } });

  if (user && (await user.matchPassword(password))) {
    // 1) create tokens
    const accessToken = generateAccessToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    // 2) set refresh token as secure, HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/api/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 3) return access token in body
    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: { token: accessToken },
    });
    return;
  }

  res.status(400).json({ success: false, error: 'Invalid email or password' });
  return;
});



// refresh endpoint
export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;

  if (!token) {res.status(401).json({ success: false, error: 'No refresh token' });
    return;
  }

  try {
    const { id } = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as { id: string };
    const newAccess = generateAccessToken(id);

    res.json({
      success: true,
      data: { token: newAccess },
    });
    return;

  } catch {
      res.status(403).json({ success: false, error: 'Invalid refresh token' });
      return;
  }
});