import rateLimit from 'express-rate-limit';
import { config } from '../config';

/**
 * 请求限流中间件
 */
export const rateLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: 42900,
        message: 'Too many requests, please try again later',
        data: null,
    },
});

/**
 * 登录接口专用限流 (更严格)
 */
export const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 10,                   // 最多 10 次尝试
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        code: 42901,
        message: 'Too many login attempts, please try again in 15 minutes',
        data: null,
    },
});
