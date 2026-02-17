import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getGatewayClient } from '../services/gatewayClient';
import type { ApiResponse, OpenClawStatus } from '../types';

const WEB_VERSION = '0.1.0';

const router = Router();

/**
 * GET /api/status
 * 返回 Web Panel 状态 + OpenClaw Gateway 连接状态
 */
router.get('/status', authMiddleware, async (_req: Request, res: Response) => {
    const gw = getGatewayClient();

    let gatewayStatus: Record<string, unknown> | null = null;
    let healthData: Record<string, unknown> | null = null;

    if (gw.connected) {
        try {
            [gatewayStatus, healthData] = await Promise.all([
                gw.getStatus().catch(() => null),
                gw.getHealth().catch(() => null),
            ]);
        } catch {
            // Gateway 连接但 RPC 失败
        }
    }

    const status: OpenClawStatus = {
        webVersion: WEB_VERSION,
        gateway: {
            connected: gw.connected,
            ...(gatewayStatus ? { status: gatewayStatus } : {}),
            ...(healthData ? { health: healthData } : {}),
        },
    };

    const response: ApiResponse<OpenClawStatus> = {
        code: 0,
        message: 'ok',
        data: status,
    };
    res.json(response);
});

/**
 * GET /api/sessions
 * 获取 Gateway 会话列表
 */
router.get('/sessions', authMiddleware, async (_req: Request, res: Response) => {
    const gw = getGatewayClient();

    if (!gw.connected) {
        res.json({ code: 50301, message: 'Gateway not connected', data: null });
        return;
    }

    try {
        const sessions = await gw.getSessions();
        res.json({ code: 0, message: 'ok', data: sessions });
    } catch (err) {
        res.json({ code: 50302, message: (err as Error).message, data: null });
    }
});

/**
 * GET /api/models
 * 获取可用模型列表
 */
router.get('/models', authMiddleware, async (_req: Request, res: Response) => {
    const gw = getGatewayClient();

    if (!gw.connected) {
        res.json({ code: 50301, message: 'Gateway not connected', data: null });
        return;
    }

    try {
        const models = await gw.getModels();
        res.json({ code: 0, message: 'ok', data: models });
    } catch (err) {
        res.json({ code: 50302, message: (err as Error).message, data: null });
    }
});

export default router;
