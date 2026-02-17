import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { api } from '../api/client';

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (password: string) => Promise<string | null>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // 启动时验证本地 Token
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setIsLoading(false);
            return;
        }

        api.verify().then((res) => {
            if (res.code === 0) {
                setIsAuthenticated(true);
            } else {
                localStorage.removeItem('token');
            }
            setIsLoading(false);
        }).catch(() => {
            localStorage.removeItem('token');
            setIsLoading(false);
        });
    }, []);

    const login = useCallback(async (password: string): Promise<string | null> => {
        const res = await api.login(password);

        if (res.code === 0 && res.data) {
            localStorage.setItem('token', res.data.token);
            setIsAuthenticated(true);
            return null; // 成功
        }

        return res.message || 'Login failed'; // 返回错误信息
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
    }, []);

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}
