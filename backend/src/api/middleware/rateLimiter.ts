import rateLimit from 'express-rate-limit';
import env from '../../core/config/env.js';

export const apiRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.NODE_ENV === 'production' ? 1000 : 50000, // Generous limits to prevent dev lockouts
    skip: () => env.NODE_ENV !== 'production', // Bypass during development and pair testing
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again after 15 minutes.'
    }
});

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: env.NODE_ENV === 'production' ? 60 : 5000, // Prevent lockout during dev login testing
    skip: () => env.NODE_ENV !== 'production', // Bypass during development
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes.'
    }
});

