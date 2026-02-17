import { useState, useEffect, useRef, useCallback } from 'react';

interface UseWebSocketOptions {
    /** JWT token for authentication */
    token: string | null;
    /** Auto-reconnect on disconnect */
    autoReconnect?: boolean;
    /** Reconnect interval in ms */
    reconnectInterval?: number;
}

interface UseWebSocketReturn {
    /** Connection status */
    connected: boolean;
    /** Whether Gateway is connected (reported by server) */
    gatewayConnected: boolean;
    /** Send a typed message */
    send: (msg: Record<string, unknown>) => void;
    /** Last received event */
    lastEvent: Record<string, unknown> | null;
    /** Subscribe to specific event types */
    subscribe: (type: string, handler: (data: Record<string, unknown>) => void) => () => void;
}

export function useWebSocket({
    token,
    autoReconnect = true,
    reconnectInterval = 5000,
}: UseWebSocketOptions): UseWebSocketReturn {
    const [connected, setConnected] = useState(false);
    const [gatewayConnected, setGatewayConnected] = useState(false);
    const [lastEvent, setLastEvent] = useState<Record<string, unknown> | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const handlersRef = useRef<Map<string, Set<(data: Record<string, unknown>) => void>>>(new Map());
    const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const connect = useCallback(() => {
        if (!token || wsRef.current) return;

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const url = `${protocol}//${window.location.host}/ws?token=${encodeURIComponent(token)}`;

        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
        };

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                setLastEvent(data);

                // 处理连接确认
                if (data.type === 'connected') {
                    setGatewayConnected(!!data.gatewayConnected);
                }

                // 分发给订阅者
                const type = data.type as string;
                const handlers = handlersRef.current.get(type);
                if (handlers) {
                    handlers.forEach((handler) => handler(data));
                }

                // 通配符订阅
                const allHandlers = handlersRef.current.get('*');
                if (allHandlers) {
                    allHandlers.forEach((handler) => handler(data));
                }
            } catch {
                // ignore parse errors
            }
        };

        ws.onclose = () => {
            setConnected(false);
            wsRef.current = null;

            if (autoReconnect && token) {
                reconnectTimerRef.current = setTimeout(connect, reconnectInterval);
            }
        };

        ws.onerror = () => {
            // close will follow
        };
    }, [token, autoReconnect, reconnectInterval]);

    // 连接/断开
    useEffect(() => {
        if (token) {
            connect();
        }

        return () => {
            if (reconnectTimerRef.current) {
                clearTimeout(reconnectTimerRef.current);
            }
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [token, connect]);

    const send = useCallback((msg: Record<string, unknown>) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(msg));
        }
    }, []);

    const subscribe = useCallback(
        (type: string, handler: (data: Record<string, unknown>) => void) => {
            if (!handlersRef.current.has(type)) {
                handlersRef.current.set(type, new Set());
            }
            handlersRef.current.get(type)!.add(handler);

            // 返回取消订阅函数
            return () => {
                handlersRef.current.get(type)?.delete(handler);
            };
        },
        []
    );

    return { connected, gatewayConnected, send, lastEvent, subscribe };
}
