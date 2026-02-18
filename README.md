# 🦞 OpenClaw Web Control Panel

局域网 Web 控制面板，通过 WS-RPC 桥接 OpenClaw Gateway，提供对话、监控、管理功能。

```
浏览器 ←HTTP/WS→ Web Panel(:8080) ←WS-RPC→ OpenClaw Gateway(:18789)
```

## 功能

- 🔐 JWT 登录认证 + 密码管理
- 💬 实时对话 (WebSocket 流式传输 + Markdown 渲染)
- 📊 系统状态监控 (Gateway 连接/健康检查)
- ⚙️ 设置管理 (密码修改, 系统信息)
- 📱 响应式设计 (深色主题, 手机/平板/桌面适配)
- 🐳 Docker 部署 (ARM64 + AMD64)

## 快速开始

### Docker 部署 (推荐)

```bash
git clone https://github.com/lt20180918/localclaw.git
cd localclaw
cp .env.example .env   # 编辑 JWT_SECRET 和密码
docker compose up --build -d
# 访问 http://localhost:8080
```

### 本地开发

```bash
# 后端
cd server && npm install && npm run dev

# 前端 (另一个终端)
cd client && npm install && npm run dev

# 访问 http://localhost:5173
```

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite |
| 后端 | Express + TypeScript + JWT |
| 数据库 | SQLite (sql.js) |
| 通信 | WebSocket + WS-RPC |
| 部署 | Docker + Docker Compose |

## 项目结构

```
localclaw/
├── client/                 # 前端 SPA
│   └── src/
│       ├── api/            # API 客户端
│       ├── components/     # 组件 (ChatWindow, StatusPanel, Sidebar...)
│       ├── context/        # React Context (Auth)
│       ├── hooks/          # Hooks (useWebSocket)
│       └── pages/          # 页面 (Login, Dashboard, Chat, Settings)
├── server/                 # 后端服务
│   └── src/
│       ├── db/             # SQLite 数据库
│       ├── middleware/     # 认证/限流/错误处理
│       ├── routes/         # API 路由
│       ├── services/       # 核心服务 (auth, gateway, chatBridge)
│       └── types/          # TypeScript 类型
├── docs/                   # 文档
├── Dockerfile              # 多阶段构建
├── docker-compose.yml      # 编排配置
└── .env.example            # 环境变量模板
```

## 文档

- [部署指南](docs/DEPLOY.md) — Docker/裸机部署 + Nginx + 故障排查
- [开发文档](docs/DEVELOPMENT.md) — 架构说明 + API 文档 + 模块说明

## 许可证

MIT
