import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import User from '../models/userModel';
import generateToken from '../utils/generateToken';

// @desc    Register a new user
// @route   POST /api/auth/signup
// @access  Public
export const signup = asyncHandler(async (req: Request, res: Response) => {
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
    const token = generateToken(user.id);
    res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      data: { token },
    });
    return;
  }

  res.status(400).json({ success: false, error: 'Invalid email or password' });
});
