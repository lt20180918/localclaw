const API_BASE = '/api';

interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    data: T | null;
}

/**
 * 统一 API 请求封装
 */
async function request<T>(
    path: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> {
    const token = localStorage.getItem('token');

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
    });

    const data: ApiResponse<T> = await res.json();
    return data;
}

/** API 方法集合 */
export const api = {
    /** 登录 */
    login: (password: string) =>
        request<{ token: string; expiresIn: number }>('/login', {
            method: 'POST',
            body: JSON.stringify({ password }),
        }),

    /** 验证 Token */
    verify: () => request('/verify'),

    /** 获取状态 */
    getStatus: () =>
        request<{
            webVersion: string;
            gateway: { connected: boolean; gatewayVersion?: string };
        }>('/status'),

    /** 修改密码 */
    changePassword: (oldPassword: string, newPassword: string) =>
        request('/change-password', {
            method: 'POST',
            body: JSON.stringify({ oldPassword, newPassword }),
        }),

    /** 获取会话列表 */
    getSessions: () => request<unknown>('/sessions'),

    /** 获取可用模型 */
    getModels: () => request<unknown>('/models'),

    /** 获取 OpenClaw 配置 */
    getConfig: () => request<Record<string, unknown>>('/config'),

    /** 更新 OpenClaw 配置 */
    setConfig: (config: Record<string, unknown>) =>
        request('/config', {
            method: 'PUT',
            body: JSON.stringify(config),
        }),

    /** 获取 Agent 列表 */
    getAgents: () => request<unknown>('/agents'),

    /** 获取日志 */
    getLogs: (lines = 100) => request<unknown>(`/logs?lines=${lines}`),

    /** 触发 OpenClaw 升级 */
    triggerUpdate: () =>
        request('/openclaw/update', { method: 'POST' }),
};
