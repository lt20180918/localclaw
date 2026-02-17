# OpenClaw Web Control Panel

局域网 Web 控制面板，用于管理 OpenClaw Agent、进行对话、查看状态与日志。

## 架构

```
浏览器 ←HTTP/WS→ Web Control Panel(:8080) ←WS-RPC→ OpenClaw Gateway(:18789)
```

## 快速开始

### 开发环境

```bash
# 后端
cd server && npm install && npm run dev

# 前端 (另一终端)
cd client && npm install && npm run dev
```

访问 `http://localhost:5173`

### Docker 部署 (Ubuntu 22.04 ARM64)

```bash
cp .env.example .env
# 编辑 .env 设置密码和 Token
docker compose up --build -d
```

访问 `http://<server-ip>:8080`

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **前端**: React 18 + TypeScript + Vite
- **数据库**: SQLite
- **部署**: Docker (ARM64)

## 项目结构

```
server/     # 后端 API + WebSocket 桥接
client/     # 前端 SPA
docs/       # 开发文档
```
