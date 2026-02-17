import app from './app';
import { config } from './config';
import { initDatabase } from './db/database';
import { initAdminPassword } from './services/authService';
import { getGatewayClient } from './services/gatewayClient';
import { setupWebSocket } from './services/chatBridge';

// ─── 启动流程 ───

async function main() {
    console.log('┌──────────────────────────────────────┐');
    console.log('│  OpenClaw Web Control Panel           │');
    console.log('│  Starting...                          │');
    console.log('└──────────────────────────────────────┘');

    // 1. 初始化数据库
    await initDatabase();

    // 2. 初始化管理员密码
    initAdminPassword();

    // 3. 启动 HTTP 服务
    const server = app.listen(config.port, '0.0.0.0', () => {
        console.log(`[Server] Listening on http://0.0.0.0:${config.port}`);
        console.log(`[Server] Local:   http://localhost:${config.port}`);
        console.log(`[Server] Gateway: ${config.gatewayUrl}`);
    });

    // 4. 启动 WebSocket 桥接
    setupWebSocket(server);

    // 5. 连接 OpenClaw Gateway
    const gw = getGatewayClient();
    gw.connect();

    gw.on('connected', () => {
        console.log('[Server] Gateway bridge established');
    });

    gw.on('disconnected', () => {
        console.log('[Server] Gateway bridge lost, will reconnect...');
    });

    // 优雅关闭
    const shutdown = () => {
        console.log('[Server] Shutting down...');
        gw.disconnect();
        server.close(() => process.exit(0));
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
}

main().catch((err) => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
});
