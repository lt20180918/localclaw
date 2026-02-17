import { useMemo } from 'react';

interface MessageBubbleProps {
    role: 'user' | 'assistant' | 'system';
    content: string;
    isStreaming?: boolean;
}

/**
 * 单条消息气泡
 * 支持用户消息 (右对齐) 和助手消息 (左对齐, Markdown 渲染)
 */
export default function MessageBubble({ role, content, isStreaming }: MessageBubbleProps) {
    // 简易 Markdown 渲染 (不依赖 react-markdown 以减小打包体积)
    const renderedContent = useMemo(() => {
        if (role === 'user') return content;
        return renderMarkdown(content);
    }, [content, role]);

    return (
        <div className={`message-bubble ${role}`}>
            <div className="message-avatar">
                {role === 'user' ? '👤' : role === 'assistant' ? '🦞' : 'ℹ️'}
            </div>
            <div className="message-body">
                {role === 'user' ? (
                    <div className="message-text">{renderedContent}</div>
                ) : (
                    <div
                        className="message-text markdown-body"
                        dangerouslySetInnerHTML={{ __html: renderedContent }}
                    />
                )}
                {isStreaming && <span className="streaming-cursor" />}
            </div>
        </div>
    );
}

/**
 * 简易 Markdown → HTML 转换
 * 支持: 代码块、行内代码、标题、加粗、斜体、链接、列表、换行
 */
function renderMarkdown(text: string): string {
    let html = escapeHtml(text);

    // 代码块 ```lang\n...\n```
    html = html.replace(
        /```(\w*)\n([\s\S]*?)```/g,
        '<pre class="code-block"><code class="lang-$1">$2</code></pre>'
    );

    // 行内代码 `code`
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // 标题 ## / ### / ####
    html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

    // 加粗 **text**
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 斜体 *text*
    html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // 链接 [text](url)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');

    // 无序列表 - item
    html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>\n?)+/gs, '<ul>$&</ul>');

    // 换行
    html = html.replace(/\n/g, '<br>');

    // 清理多余的 <br> (标签后的)
    html = html.replace(/<\/h[1-4]><br>/g, '</h$1>');
    html = html.replace(/<\/pre><br>/g, '</pre>');
    html = html.replace(/<\/ul><br>/g, '</ul>');

    return html;
}

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
