import { Request, Response, NextFunction } from 'express';
import type { ApiResponse } from '../types';

/**
 * 全局错误处理中间件
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    console.error('[Error]', err.message, err.stack);

    const response: ApiResponse = {
        code: 50000,
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
        data: null,
    };

    res.status(500).json(response);
}
