import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    isStreaming?: boolean;
}

interface ChatWindowProps {
    token: string | null;
}

export default function ChatWindow({ token }: ChatWindowProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { connected, gatewayConnected, send, subscribe } = useWebSocket({
        token,
    });

    // 自动滚动到底部
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    // 订阅对话事件
    useEffect(() => {
        // 对话流开始
        const unsubStart = subscribe('chat.start', () => {
            setIsStreaming(true);
            setMessages((prev) => [...prev, { role: 'assistant', content: '', isStreaming: true }]);
        });

        // 流式内容片段
        const unsubDelta = subscribe('chat.delta', (data) => {
            const content = (data.content || data.text || '') as string;
            setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant' && last.isStreaming) {
                    updated[updated.length - 1] = {
                        ...last,
                        content: last.content + content,
                    };
                }
                return updated;
            });
        });

        // 对话完成
        const unsubDone = subscribe('chat.done', () => {
            setIsStreaming(false);
            setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.role === 'assistant') {
                    updated[updated.length - 1] = { ...last, isStreaming: false };
                }
                return updated;
            });
        });

        // 对话错误
        const unsubError = subscribe('chat.error', (data) => {
            setIsStreaming(false);
            setMessages((prev) => [
                ...prev.map((m) => ({ ...m, isStreaming: false })),
                { role: 'system' as const, content: `❌ 错误: ${data.message || '未知错误'}` },
            ]);
        });

        // 通用错误
        const unsubGenericError = subscribe('error', (data) => {
            setMessages((prev) => [
                ...prev,
                { role: 'system' as const, content: `⚠️ ${data.message || '连接错误'}` },
            ]);
        });

        return () => {
            unsubStart();
            unsubDelta();
            unsubDone();
            unsubError();
            unsubGenericError();
        };
    }, [subscribe]);

    // 发送消息
    const handleSend = (text: string) => {
        // 添加用户消息
        setMessages((prev) => [...prev, { role: 'user', content: text }]);

        // 通过 WebSocket 发送到 Gateway
        send({ type: 'chat.send', message: text });
    };

    // 中止对话
    const handleAbort = () => {
        send({ type: 'chat.abort' });
        setIsStreaming(false);
        setMessages((prev) =>
            prev.map((m) => ({ ...m, isStreaming: false }))
        );
    };

    const canChat = connected && gatewayConnected;

    return (
        <div className="chat-window">
            <div className="chat-header">
                <h3>💬 对话</h3>
                <div className="chat-status">
                    <span className={`status-dot ${canChat ? 'online' : 'offline'}`} />
                    {canChat ? 'Gateway 已连接' : '等待 Gateway 连接...'}
                </div>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div className="chat-empty">
                        <div className="chat-empty-icon">🦞</div>
                        <p>发送消息开始对话</p>
                        {!canChat && (
                            <p className="chat-empty-hint">
                                等待 Gateway 连接后即可开始...
                            </p>
                        )}
                    </div>
                )}

                {messages.map((msg, idx) => (
                    <MessageBubble
                        key={idx}
                        role={msg.role}
                        content={msg.content}
                        isStreaming={msg.isStreaming}
                    />
                ))}

                <div ref={messagesEndRef} />
            </div>

            <ChatInput
                onSend={handleSend}
                onAbort={handleAbort}
                disabled={!canChat}
                isStreaming={isStreaming}
            />
        </div>
    );
}
