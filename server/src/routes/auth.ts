import { Router, Request, Response } from 'express';
import { login, changePassword } from '../services/authService';
import { loginRateLimiter } from '../middleware/rateLimit';
import { authMiddleware } from '../middleware/auth';
import type { ApiResponse, LoginRequest, LoginResponse } from '../types';

const router = Router();

/**
 * POST /api/login
 * 管理员登录
 */
router.post('/login', loginRateLimiter, (req: Request, res: Response) => {
    const { password } = req.body as LoginRequest;

    if (!password) {
        const response: ApiResponse = {
            code: 40000,
            message: 'Password is required',
            data: null,
        };
        res.status(400).json(response);
        return;
    }

    const result = login(password);

    if (!result) {
        const response: ApiResponse = {
            code: 40100,
            message: 'Invalid password',
            data: null,
        };
        res.status(401).json(response);
        return;
    }

    const response: ApiResponse<LoginResponse> = {
        code: 0,
        message: 'ok',
        data: result,
    };
    res.json(response);
});

/**
 * POST /api/change-password
 * 修改管理员密码 (需认证)
 */
router.post('/change-password', authMiddleware, (req: Request, res: Response) => {
    const { oldPassword, newPassword } = req.body as {
        oldPassword: string;
        newPassword: string;
    };

    if (!oldPassword || !newPassword) {
        const response: ApiResponse = {
            code: 40000,
            message: 'Both oldPassword and newPassword are required',
            data: null,
        };
        res.status(400).json(response);
        return;
    }

    if (newPassword.length < 6) {
        const response: ApiResponse = {
            code: 40001,
            message: 'New password must be at least 6 characters',
            data: null,
        };
        res.status(400).json(response);
        return;
    }

    const success = changePassword(oldPassword, newPassword);

    if (!success) {
        const response: ApiResponse = {
            code: 40100,
            message: 'Old password is incorrect',
            data: null,
        };
        res.status(401).json(response);
        return;
    }

    const response: ApiResponse = {
        code: 0,
        message: 'Password changed successfully',
        data: null,
    };
    res.json(response);
});

/**
 * GET /api/verify
 * 验证 Token 是否有效 (前端检测登录状态)
 */
router.get('/verify', authMiddleware, (_req: Request, res: Response) => {
    const response: ApiResponse = {
        code: 0,
        message: 'Token is valid',
        data: null,
    };
    res.json(response);
});

export default router;
