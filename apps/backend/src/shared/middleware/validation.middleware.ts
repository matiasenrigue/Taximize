import { body, validationResult } from 'express-validator';
import e, { Request, Response, NextFunction } from 'express';

/**
 * Validates request data and returns appropriate error responses
 * 
 * Source: https://stackoverflow.com/questions/55772477/how-to-implement-validation-in-a-separate-file-using-express-validator
 * The errors from express-validator are stored in the request and you can access them in any express middleware
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ 
      success: false, 
      errors : errors.array()
    });
    return;
  }
  next();
};

/**
 * Validation chain for user signup
 * 
 * Source: https://stackoverflow.com/questions/34760548/how-to-validate-password-using-express-validator-npm
 * Basic pattern for password validation with express-validator
 */
export const signupValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[A-Za-z])(?=.*\d)/).withMessage('Password must contain letters and numbers'),
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3 }).withMessage('Username must be at least 3 characters')
    .trim().escape(),
  validateRequest
];

export const signinValidation = [
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  validateRequest
];