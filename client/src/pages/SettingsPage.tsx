import { useState, FormEvent } from 'react';
import { api } from '../api/client';

export default function SettingsPage() {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState<'success' | 'error'>('success');
    const [loading, setLoading] = useState(false);

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setMessage('新密码与确认密码不一致');
            setMessageType('error');
            return;
        }

        if (newPassword.length < 6) {
            setMessage('新密码长度至少 6 位');
            setMessageType('error');
            return;
        }

        setLoading(true);
        setMessage('');

        try {
            const res = await api.changePassword(oldPassword, newPassword);
            if (res.code === 0) {
                setMessage('密码修改成功');
                setMessageType('success');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                setMessage(res.message || '密码修改失败');
                setMessageType('error');
            }
        } catch {
            setMessage('请求失败，请重试');
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="settings-page animate-fadeIn">
            <h2 className="page-title">⚙️ 设置</h2>

            {/* 修改密码 */}
            <div className="card">
                <div className="card-header">
                    <span className="card-title">修改管理密码</span>
                </div>

                {message && (
                    <div className={`settings-message ${messageType}`}>
                        {message}
                    </div>
                )}

                <form onSubmit={handleChangePassword}>
                    <div className="form-group">
                        <label>当前密码</label>
                        <input
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            placeholder="输入当前密码"
                        />
                    </div>
                    <div className="form-group">
                        <label>新密码</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={6}
                            placeholder="至少 6 位"
                        />
                    </div>
                    <div className="form-group">
                        <label>确认新密码</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            placeholder="再次输入新密码"
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={loading}
                    >
                        {loading ? '修改中...' : '修改密码'}
                    </button>
                </form>
            </div>

            {/* 系统信息 */}
            <div className="card" style={{ marginTop: 'var(--space-md)' }}>
                <div className="card-header">
                    <span className="card-title">关于</span>
                </div>
                <div className="about-info">
                    <div className="about-row">
                        <span className="about-label">项目</span>
                        <span>OpenClaw Web Control Panel</span>
                    </div>
                    <div className="about-row">
                        <span className="about-label">版本</span>
                        <span>0.1.0</span>
                    </div>
                    <div className="about-row">
                        <span className="about-label">技术栈</span>
                        <span>React 18 + Express + TypeScript</span>
                    </div>
                    <div className="about-row">
                        <span className="about-label">源码</span>
                        <a href="https://github.com/lt20180918/localclaw" target="_blank" rel="noreferrer">
                            GitHub
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
