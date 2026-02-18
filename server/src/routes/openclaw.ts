import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getGatewayClient } from '../services/gatewayClient';

const router = Router();

/**
 * GET /api/config
 * 获取 OpenClaw 配置 (代理 Gateway config.get)
 */
router.get('/config', authMiddleware, async (_req: Request, res: Response) => {
    const gw = getGatewayClient();

    if (!gw.connected) {
        res.json({ code: 50301, message: 'Gateway not connected', data: null });
        return;
    }

    try {
        const config = await gw.getConfig();
        res.json({ code: 0, message: 'ok', data: config });
    } catch (err) {
        res.json({ code: 50302, message: (err as Error).message, data: null });
    }
});

/**
 * PUT /api/config
 * 更新 OpenClaw 配置 (代理 Gateway config.set)
 */
router.put('/config', authMiddleware, async (req: Request, res: Response) => {
    const gw = getGatewayClient();

    if (!gw.connected) {
        res.json({ code: 50301, message: 'Gateway not connected', data: null });
        return;
    }

    try {
        const result = await gw.call('config.set', req.body);
        res.json({ code: 0, message: 'ok', data: result });
    } catch (err) {
        res.json({ code: 50302, message: (err as Error).message, data: null });
    }
});

/**
 * POST /api/openclaw/update
 * 触发 OpenClaw 升级 (代理 Gateway update.run)
 */
router.post('/openclaw/update', authMiddleware, async (_req: Request, res: Response) => {
    const gw = getGatewayClient();

    if (!gw.connected) {
        res.json({ code: 50301, message: 'Gateway not connected', data: null });
        return;
    }

    try {
        const result = await gw.call('update.run');
        res.json({ code: 0, message: 'ok', data: result });
    } catch (err) {
        res.json({ code: 50302, message: (err as Error).message, data: null });
    }
});

/**
 * GET /api/agents
 * 获取 Agent 列表 (代理 Gateway agents.list)
 */
router.get('/agents', authMiddleware, async (_req: Request, res: Response) => {
    const gw = getGatewayClient();

    if (!gw.connected) {
        res.json({ code: 50301, message: 'Gateway not connected', data: null });
        return;
    }

    try {
        const agents = await gw.call('agents.list');
        res.json({ code: 0, message: 'ok', data: agents });
    } catch (err) {
        res.json({ code: 50302, message: (err as Error).message, data: null });
    }
});

/**
 * GET /api/logs
 * 获取日志 (代理 Gateway logs.tail)
 */
router.get('/logs', authMiddleware, async (req: Request, res: Response) => {
    const gw = getGatewayClient();

    if (!gw.connected) {
        res.json({ code: 50301, message: 'Gateway not connected', data: null });
        return;
    }

    try {
        const lines = parseInt(req.query.lines as string) || 100;
        const logs = await gw.call('logs.tail', { lines });
        res.json({ code: 0, message: 'ok', data: logs });
    } catch (err) {
        res.json({ code: 50302, message: (err as Error).message, data: null });
    }
});

export default router;
