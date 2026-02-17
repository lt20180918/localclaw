// ─── API 响应 ───

export interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    data: T | null;
}

// ─── 认证 ───

export interface LoginRequest {
    password: string;
}

export interface LoginResponse {
    token: string;
    expiresIn: number;
}

export interface JwtPayload {
    role: 'admin';
    iat: number;
    exp: number;
}

// ─── OpenClaw Gateway ───

export interface GatewayStatus {
    connected: boolean;
    gatewayVersion?: string;
    uptime?: number;
    status?: Record<string, unknown>;
    health?: Record<string, unknown>;
}

export interface OpenClawStatus {
    webVersion: string;
    gateway: GatewayStatus;
}

// ─── WebSocket 消息 ───

export interface WsMessage {
    type: string;
    [key: string]: unknown;
}

export interface ChatMessage {
    type: 'chat';
    sessionKey?: string;
    message: string;
    idempotencyKey?: string;
}

export interface ChatEvent {
    type: 'chat.event';
    content?: string;
    done?: boolean;
    [key: string]: unknown;
}
