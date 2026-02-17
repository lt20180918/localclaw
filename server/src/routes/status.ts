import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import type { ApiResponse, OpenClawStatus } from '../types';
import { version } from '../../package.json';

const router = Router();

/**
 * GET /api/status
 * 返回 Web Panel 状态 + OpenClaw Gateway 连接状态
 * Phase 2 将增加实际 Gateway 状态检测
 */
router.get('/status', authMiddleware, (_req: Request, res: Response) => {
    const status: OpenClawStatus = {
        webVersion: version,
        gateway: {
            connected: false, // Phase 2 实现实际检测
        },
    };

    const response: ApiResponse<OpenClawStatus> = {
        code: 0,
        message: 'ok',
        data: status,
    };
    res.json(response);
});

export default router;
