import { useState, FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
    onSend: (message: string) => void;
    onAbort: () => void;
    disabled?: boolean;
    isStreaming?: boolean;
}

export default function ChatInput({ onSend, onAbort, disabled, isStreaming }: ChatInputProps) {
    const [input, setInput] = useState('');

    const handleSubmit = (e?: FormEvent) => {
        e?.preventDefault();
        const text = input.trim();
        if (!text || disabled) return;
        onSend(text);
        setInput('');
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        // Enter 发送, Shift+Enter 换行
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    return (
        <div className="chat-input-wrapper">
            <form className="chat-input-form" onSubmit={handleSubmit}>
                <textarea
                    className="chat-textarea"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
                    rows={1}
                    disabled={disabled}
                />
                {isStreaming ? (
                    <button
                        type="button"
                        className="btn btn-ghost btn-sm chat-abort-btn"
                        onClick={onAbort}
                    >
                        ■ 停止
                    </button>
                ) : (
                    <button
                        type="submit"
                        className="btn btn-primary btn-sm chat-send-btn"
                        disabled={disabled || !input.trim()}
                    >
                        发送
                    </button>
                )}
            </form>
        </div>
    );
}
