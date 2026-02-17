import dotenv from 'dotenv';
import path from 'path';

// 加载 .env 文件（从项目根目录）
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
    /** Web Panel 端口 */
    port: parseInt(process.env.PORT || '8080', 10),

    /** JWT 密钥 */
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',

    /** JWT 过期时间 (秒) */
    jwtExpiresIn: parseInt(process.env.JWT_EXPIRES_IN || '86400', 10), // 24h

    /** 管理员初始密码 */
    adminPassword: process.env.ADMIN_PASSWORD || 'admin123',

    /** OpenClaw Gateway WebSocket URL */
    gatewayUrl: process.env.OPENCLAW_GATEWAY_URL || 'ws://127.0.0.1:18789',

    /** OpenClaw Gateway Token */
    gatewayToken: process.env.OPENCLAW_GATEWAY_TOKEN || '',

    /** SQLite 数据库路径 */
    dbPath: process.env.DB_PATH || path.resolve(__dirname, '../../data/localclaw.db'),

    /** 限流: 每窗口最大请求数 */
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),

    /** 限流窗口 (毫秒) */
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
};
