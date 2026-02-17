import WebSocket from 'ws';
import { EventEmitter } from 'events';
import { config } from '../config';

/**
 * OpenClaw Gateway WS-RPC 客户端
 *
 * 通过 WebSocket 连接 OpenClaw Gateway (:18789)，
 * 发送 RPC 请求并接收事件流。
 *
 * 支持的 RPC 方法参见 https://docs.openclaw.ai/web/control-ui
 */
export class GatewayClient extends EventEmitter {
    private ws: WebSocket | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private pendingCalls = new Map<string, {
        resolve: (value: unknown) => void;
        reject: (reason: Error) => void;
        timer: ReturnType<typeof setTimeout>;
    }>();
    private callId = 0;
    private _connected = false;

    /** 是否已连接 */
    get connected(): boolean {
        return this._connected;
    }

    /** 建立连接 */
    connect(): void {
        if (this.ws) return;

        const url = config.gatewayUrl;
        const headers: Record<string, string> = {};
        if (config.gatewayToken) {
            headers['Authorization'] = `Bearer ${config.gatewayToken}`;
        }

        console.log(`[Gateway] Connecting to ${url}...`);

        try {
            this.ws = new WebSocket(url, { headers });
        } catch (err) {
            console.error('[Gateway] Connection error:', err);
            this.scheduleReconnect();
            return;
        }

        this.ws.on('open', () => {
            console.log('[Gateway] Connected');
            this._connected = true;
            this.emit('connected');
        });

        this.ws.on('message', (data: WebSocket.Data) => {
            try {
                const msg = JSON.parse(data.toString());
                this.handleMessage(msg);
            } catch (err) {
                console.error('[Gateway] Parse error:', err);
            }
        });

        this.ws.on('close', (code, reason) => {
            console.log(`[Gateway] Disconnected: ${code} ${reason.toString()}`);
            this.cleanup();
            this.scheduleReconnect();
        });

        this.ws.on('error', (err) => {
            console.error('[Gateway] WebSocket error:', err.message);
            // close event will follow and trigger reconnect
        });
    }

    /** 发送 RPC 调用并等待响应 */
    async call<T = unknown>(method: string, params: Record<string, unknown> = {}): Promise<T> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('Gateway not connected');
        }

        const id = String(++this.callId);

        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pendingCalls.delete(id);
                reject(new Error(`RPC call '${method}' timed out`));
            }, 30000); // 30s 超时

            this.pendingCalls.set(id, { resolve: resolve as (v: unknown) => void, reject, timer });

            const message = JSON.stringify({
                id,
                method,
                params,
            });

            this.ws!.send(message);
        });
    }

    /** 发送消息 (无需等待响应, 如 chat.send) */
    send(method: string, params: Record<string, unknown> = {}): void {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            throw new Error('Gateway not connected');
        }

        const id = String(++this.callId);

        this.ws.send(
            JSON.stringify({
                id,
                method,
                params,
            })
        );
    }

    /** 断开连接 */
    disconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        if (this.ws) {
            this.ws.close();
            this.cleanup();
        }
    }

    // ─── 便捷方法 ───

    /** 获取 Gateway 状态 */
    async getStatus(): Promise<Record<string, unknown>> {
        return this.call('status');
    }

    /** 获取健康检查 */
    async getHealth(): Promise<Record<string, unknown>> {
        return this.call('health');
    }

    /** 获取可用模型列表 */
    async getModels(): Promise<Record<string, unknown>> {
        return this.call('models.list');
    }

    /** 获取会话列表 */
    async getSessions(): Promise<Record<string, unknown>> {
        return this.call('sessions.list');
    }

    /** 获取配置 */
    async getConfig(): Promise<Record<string, unknown>> {
        return this.call('config.get');
    }

    /** 发送对话消息 */
    sendChat(message: string, sessionKey?: string): void {
        this.send('chat.send', {
            text: message,
            ...(sessionKey ? { sessionKey } : {}),
        });
    }

    /** 中止对话 */
    abortChat(sessionKey?: string): void {
        this.send('chat.abort', sessionKey ? { sessionKey } : {});
    }

    /** 获取对话历史 */
    async getChatHistory(sessionKey?: string): Promise<Record<string, unknown>> {
        return this.call('chat.history', sessionKey ? { sessionKey } : {});
    }

    // ─── 内部方法 ───

    private handleMessage(msg: Record<string, unknown>): void {
        // RPC 响应 (有 id 字段)
        if (msg.id && this.pendingCalls.has(msg.id as string)) {
            const pending = this.pendingCalls.get(msg.id as string)!;
            this.pendingCalls.delete(msg.id as string);
            clearTimeout(pending.timer);

            if (msg.error) {
                pending.reject(new Error(String((msg.error as Record<string, unknown>)?.message || msg.error)));
            } else {
                pending.resolve(msg.payload ?? msg.result ?? msg);
            }
            return;
        }

        // 事件推送 (无 id, 如 chat events, logs 等)
        const eventType = (msg.type || msg.method || 'unknown') as string;
        this.emit('event', msg);
        this.emit(eventType, msg);
    }

    private cleanup(): void {
        this._connected = false;
        this.ws = null;

        // 拒绝所有待处理的调用
        for (const [id, pending] of this.pendingCalls) {
            clearTimeout(pending.timer);
            pending.reject(new Error('Connection closed'));
            this.pendingCalls.delete(id);
        }

        this.emit('disconnected');
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimer) return;

        console.log('[Gateway] Reconnecting in 5s...');
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            this.connect();
        }, 5000);
    }
}

// 全局单例
let gatewayClient: GatewayClient | null = null;

/** 获取 GatewayClient 单例 */
export function getGatewayClient(): GatewayClient {
    if (!gatewayClient) {
        gatewayClient = new GatewayClient();
    }
    return gatewayClient;
}
