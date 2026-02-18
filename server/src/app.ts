import express from 'express';
import cors from 'cors';
import path from 'path';
import { rateLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import authRoutes from './routes/auth';
import statusRoutes from './routes/status';
import openclawRoutes from './routes/openclaw';
import setupRoutes from './routes/setup';

const app = express();

// ─── 基础中间件 ───
app.use(cors());
app.use(express.json());
app.use(rateLimiter);

// ─── 访问日志 ───
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// ─── API 路由 ───
app.use('/api', authRoutes);
app.use('/api', statusRoutes);
app.use('/api', openclawRoutes);
app.use('/api', setupRoutes);

// ─── 静态文件 (生产环境: 前端构建产物) ───
const clientDist = path.resolve(__dirname, '../../client/dist');
app.use(express.static(clientDist));

// SPA fallback: 所有非 API 请求返回 index.html
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/ws')) {
        next();
        return;
    }
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
        if (err) {
            // client/dist 不存在时的开发环境
            res.status(200).json({ message: 'Web Control Panel API. Frontend not built yet.' });
        }
    });
});

// ─── 全局错误处理 ───
app.use(errorHandler);

export default app;
