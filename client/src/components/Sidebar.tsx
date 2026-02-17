interface SidebarProps {
    activePage: string;
    onNavigate: (page: string) => void;
}

const NAV_ITEMS = [
    { id: 'dashboard', label: '仪表盘', icon: '📊' },
    { id: 'chat', label: '对话', icon: '💬' },
    { id: 'settings', label: '设置', icon: '⚙️' },
];

export default function Sidebar({ activePage, onNavigate }: SidebarProps) {
    return (
        <aside className="sidebar glass">
            <div className="sidebar-brand">
                <span className="sidebar-logo">🦞</span>
                <span className="sidebar-title">OpenClaw</span>
            </div>

            <nav className="sidebar-nav">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.id}
                        className={`sidebar-item ${activePage === item.id ? 'active' : ''}`}
                        onClick={() => onNavigate(item.id)}
                    >
                        <span className="sidebar-item-icon">{item.icon}</span>
                        <span className="sidebar-item-label">{item.label}</span>
                    </button>
                ))}
            </nav>

            <div className="sidebar-footer">
                <span className="sidebar-version">v0.1.0</span>
            </div>
        </aside>
    );
}
