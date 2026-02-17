import app from './app';
import { config } from './config';
import { initDatabase } from './db/database';
import { initAdminPassword } from './services/authService';

// ─── 启动流程 ───

async function main() {
    console.log('┌──────────────────────────────────────┐');
    console.log('│  OpenClaw Web Control Panel           │');
    console.log('│  Starting...                          │');
    console.log('└──────────────────────────────────────┘');

    // 1. 初始化数据库 (sql.js 是异步的)
    await initDatabase();

    // 2. 初始化管理员密码
    initAdminPassword();

    // 3. 启动 HTTP 服务
    const server = app.listen(config.port, '0.0.0.0', () => {
        console.log(`[Server] Listening on http://0.0.0.0:${config.port}`);
        console.log(`[Server] Local:   http://localhost:${config.port}`);
        console.log(`[Server] Gateway: ${config.gatewayUrl}`);
    });

    // 4. Phase 3: WebSocket 服务将挂载到 server 上
    // setupWebSocket(server);

    // 优雅关闭
    process.on('SIGTERM', () => {
        console.log('[Server] SIGTERM received, shutting down...');
        server.close(() => process.exit(0));
    });

    process.on('SIGINT', () => {
        console.log('[Server] SIGINT received, shutting down...');
        server.close(() => process.exit(0));
    });
}

main().catch((err) => {
    console.error('[Server] Failed to start:', err);
    process.exit(1);
});
