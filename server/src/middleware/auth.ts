import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../services/authService';
import type { ApiResponse } from '../types';

/**
 * JWT 认证中间件
 * 从 Authorization: Bearer <token> 提取并验证 Token
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        const response: ApiResponse = {
            code: 40100,
            message: 'Missing or invalid authorization header',
            data: null,
        };
        res.status(401).json(response);
        return;
    }

    const token = authHeader.slice(7);
    const payload = verifyToken(token);

    if (!payload) {
        const response: ApiResponse = {
            code: 40101,
            message: 'Token invalid or expired',
            data: null,
        };
        res.status(401).json(response);
        return;
    }

    // 将解码后的 payload 挂到 request 上
    (req as any).user = payload;
    next();
}
