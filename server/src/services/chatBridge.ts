import { Server as HttpServer } from 'http';
import { WebSocket, WebSocketServer } from 'ws';
import { URL } from 'url';
import { verifyToken } from '../services/authService';
import { getGatewayClient } from '../services/gatewayClient';

/**
 * WebSocket 对话桥接
 *
 * 浏览器客户端 ←WS→ Web Panel ←WS-RPC→ OpenClaw Gateway
 *
 * 功能:
 * 1. 认证: 通过 ?token=xxx 验证 JWT
 * 2. chat.send: 浏览器发消息 → 转发到 Gateway
 * 3. chat events: Gateway 流式事件 → 广播到所有已认证客户端
 * 4. chat.abort: 中止对话
 * 5. chat.history: 获取对话历史
 */

interface AuthenticatedClient {
    ws: WebSocket;
    userId: string;
}

const clients = new Set<AuthenticatedClient>();

export function setupWebSocket(server: HttpServer): void {
    const wss = new WebSocketServer({ server, path: '/ws' });

    // 监听 Gateway 事件并广播到所有客户端
    const gw = getGatewayClient();

    gw.on('event', (event: Record<string, unknown>) => {
        const message = JSON.stringify(event);
        for (const client of clients) {
            if (client.ws.readyState === WebSocket.OPEN) {
                client.ws.send(message);
            }
        }
    });

    wss.on('connection', (ws: WebSocket, req) => {
        // ─── 认证 ───
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const token = url.searchParams.get('token');

        if (!token) {
            ws.close(4001, 'Missing token');
            return;
        }

        const payload = verifyToken(token);
        if (!payload) {
            ws.close(4001, 'Invalid token');
            return;
        }

        const client: AuthenticatedClient = { ws, userId: payload.role };
        clients.add(client);
        console.log(`[WS] Client connected (total: ${clients.size})`);

        // 发送连接确认
        ws.send(JSON.stringify({
            type: 'connected',
            gatewayConnected: gw.connected,
        }));

        // ─── 处理客户端消息 ───
        ws.on('message', (data) => {
            try {
                const msg = JSON.parse(data.toString());
                handleClientMessage(client, msg);
            } catch (err) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format',
                }));
            }
        });

        ws.on('close', () => {
            clients.delete(client);
            console.log(`[WS] Client disconnected (total: ${clients.size})`);
        });

        ws.on('error', (err) => {
            console.error('[WS] Client error:', err.message);
            clients.delete(client);
        });
    });

    console.log('[WS] WebSocket server ready at /ws');
}

function handleClientMessage(
    client: AuthenticatedClient,
    msg: Record<string, unknown>
): void {
    const gw = getGatewayClient();

    if (!gw.connected) {
        client.ws.send(JSON.stringify({
            type: 'error',
            message: 'Gateway not connected',
        }));
        return;
    }

    switch (msg.type) {
        case 'chat.send':
            gw.sendChat(
                msg.message as string,
                msg.sessionKey as string | undefined
            );
            break;

        case 'chat.abort':
            gw.abortChat(msg.sessionKey as string | undefined);
            break;

        case 'chat.history':
            gw.getChatHistory(msg.sessionKey as string | undefined)
                .then((history) => {
                    client.ws.send(JSON.stringify({
                        type: 'chat.history',
                        data: history,
                    }));
                })
                .catch((err) => {
                    client.ws.send(JSON.stringify({
                        type: 'error',
                        message: (err as Error).message,
                    }));
                });
            break;

        default:
            // 通用 RPC 代理: 将任意方法转发到 Gateway
            if (msg.method) {
                gw.call(msg.method as string, (msg.params || {}) as Record<string, unknown>)
                    .then((result) => {
                        client.ws.send(JSON.stringify({
                            type: 'rpc.result',
                            method: msg.method,
                            data: result,
                        }));
                    })
                    .catch((err) => {
                        client.ws.send(JSON.stringify({
                            type: 'rpc.error',
                            method: msg.method,
                            message: (err as Error).message,
                        }));
                    });
            }
            break;
    }
}
