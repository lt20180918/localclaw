import ChatWindow from '../components/ChatWindow';

interface ChatPageProps {
    token: string | null;
}

export default function ChatPage({ token }: ChatPageProps) {
    return (
        <div className="chat-page animate-fadeIn">
            <ChatWindow token={token} />
        </div>
    );
}
