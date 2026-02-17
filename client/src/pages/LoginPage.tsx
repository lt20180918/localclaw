import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
    const { login } = useAuth();
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!password.trim()) return;

        setError('');
        setLoading(true);

        const errMsg = await login(password);
        if (errMsg) {
            setError(errMsg);
        }
        setLoading(false);
    };

    return (
        <div className="login-page">
            <form className="login-card" onSubmit={handleSubmit}>
                <span className="logo">🦞</span>
                <h1>OpenClaw</h1>
                <p className="subtitle">Web Control Panel</p>

                {error && <div className="login-error">{error}</div>}

                <div className="form-group">
                    <label htmlFor="password">管理员密码</label>
                    <input
                        id="password"
                        type="password"
                        placeholder="输入密码..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        autoComplete="current-password"
                    />
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? (
                        <>
                            <span className="spinner" />
                            验证中...
                        </>
                    ) : (
                        '登录'
                    )}
                </button>
            </form>
        </div>
    );
}
