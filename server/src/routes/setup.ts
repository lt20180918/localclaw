import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
    getSetupConfig,
    setSetting,
    setSettings,
    isSetupComplete,
    getSetting,
} from '../services/setupService';
import { getGatewayClient } from '../services/gatewayClient';

const router = Router();

/**
 * GET /api/setup/status
 * 检查初始设置状态 (是否已配置 API Key)
 */
router.get('/setup/status', authMiddleware, (_req: Request, res: Response) => {
    res.json({
        code: 0,
        message: 'ok',
        data: {
            setupComplete: isSetupComplete(),
        },
    });
});

/**
 * GET /api/setup/config
 * 获取设置配置 (API Key 已脱敏)
 */
router.get('/setup/config', authMiddleware, (_req: Request, res: Response) => {
    res.json({
        code: 0,
        message: 'ok',
        data: getSetupConfig(),
    });
});

/**
 * POST /api/setup/save
 * 保存设置 (支持部分更新)
 *
 * Body: { llm_api_key?, llm_model?, llm_base_url?, channel_appid?, channel_secret? }
 */
router.post('/setup/save', authMiddleware, (req: Request, res: Response) => {
    const allowedKeys = [
        'llm_api_key',
        'llm_model',
        'llm_base_url',
        'channel_appid',
        'channel_secret',
    ];

    const updates: Record<string, string> = {};

    for (const key of allowedKeys) {
        if (req.body[key] !== undefined && req.body[key] !== null) {
            updates[key] = String(req.body[key]);
        }
    }

    if (Object.keys(updates).length === 0) {
        res.json({ code: 40001, message: '没有可保存的配置项', data: null });
        return;
    }

    setSettings(updates);

    // 如果更新了 API Key 或 model, 同时推送到 Gateway (如果已连接)
    const gw = getGatewayClient();
    if (gw.connected) {
        const gwConfig: Record<string, unknown> = {};
        if (updates.llm_api_key) gwConfig.api_key = updates.llm_api_key;
        if (updates.llm_model) gwConfig.model = updates.llm_model;
        if (updates.llm_base_url) gwConfig.base_url = updates.llm_base_url;
        if (updates.channel_appid) gwConfig.channel_appid = updates.channel_appid;
        if (updates.channel_secret) gwConfig.channel_secret = updates.channel_secret;

        if (Object.keys(gwConfig).length > 0) {
            gw.call('config.set', gwConfig).catch((err) => {
                console.warn('[Setup] Failed to push config to Gateway:', err.message);
            });
        }
    }

    res.json({
        code: 0,
        message: 'ok',
        data: getSetupConfig(),
    });
});

/**
 * POST /api/setup/test
 * 测试 API Key 是否有效
 *
 * 使用已保存的 API Key 和 model 尝试向 LLM 服务发送一个简单请求
 * 如果 Gateway 已连接则通过 Gateway 测试, 否则返回仅本地验证结果
 */
router.post('/setup/test', authMiddleware, async (_req: Request, res: Response) => {
    const apiKey = getSetting('llm_api_key');

    if (!apiKey) {
        res.json({ code: 40002, message: '请先保存 API Key', data: null });
        return;
    }

    const gw = getGatewayClient();

    if (!gw.connected) {
        // Gateway 未连接, 只做基本格式校验
        const valid = apiKey.length >= 10;
        res.json({
            code: 0,
            message: 'ok',
            data: {
                valid,
                method: 'local',
                detail: valid
                    ? 'API Key 格式正确 (Gateway 未连接, 无法在线验证)'
                    : 'API Key 格式不正确',
            },
        });
        return;
    }

    try {
        const result = await gw.call('config.test', { api_key: apiKey });
        res.json({
            code: 0,
            message: 'ok',
            data: { valid: true, method: 'gateway', detail: result },
        });
    } catch (err) {
        res.json({
            code: 0,
            message: 'ok',
            data: {
                valid: false,
                method: 'gateway',
                detail: (err as Error).message,
            },
        });
    }
});

export default router;
