# OpenClaw Web Control Panel — 开发文档

## 项目简述

局域网 Web 控制面板，通过 WS-RPC 桥接 OpenClaw Gateway，提供美观的对话、管理、监控界面。

```
浏览器 ←HTTP/WS→ Web Control Panel(:8080) ←WS-RPC→ OpenClaw Gateway(:18789)
```

## 架构层级

| 层 | 路径 | 职责 |
|----|------|------|
| 前端 SPA | `client/` | React 18 + Vite + TypeScript + 深色主题 |
| HTTP API | `server/src/routes/` | Express REST 端点 (JWT 认证) |
| WS 桥接 | `server/src/services/chatBridge.ts` | 浏览器 WS ↔ Gateway WS-RPC |
| Gateway 客户端 | `server/src/services/gatewayClient.ts` | WS-RPC 协议封装 |
| 持久化 | `server/src/db/database.ts` | sql.js (SQLite) |

## 关键模块说明

### `gatewayClient.ts` — Gateway WS-RPC 客户端
- **单例模式** (`getGatewayClient()`)
- **自动重连**: 断开后 5 秒重连
- **请求/响应追踪**: 通过 `id` 匹配，30s 超时
- **RPC 调用**: `call(method, params)` → Promise
- **事件推送**: Gateway 事件通过 EventEmitter 广播
- **便捷方法**: `getStatus()`, `sendChat()`, `getChatHistory()` 等

### `chatBridge.ts` — WebSocket 桥接
- **认证**: 浏览器通过 `?token=JWT` 连接 `/ws`
- **消息路由**: `chat.send`, `chat.abort`, `chat.history`
- **通用 RPC**: 支持 `{ method, params }` 格式转发任意 RPC
- **事件广播**: Gateway 事件广播到所有已认证客户端

### 认证流程
1. 浏览器 → `POST /api/login` (密码) → JWT Token
2. HTTP 请求: `Authorization: Bearer <token>`
3. WebSocket: `ws://host/ws?token=<token>`
4. Token 有效期 24h，前端自动验证

### API 端点

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| POST | `/api/login` | ✗ | 登录 (有限流) |
| GET | `/api/verify` | ✓ | Token 验证 |
| POST | `/api/change-password` | ✓ | 修改密码 |
| GET | `/api/status` | ✓ | 状态 (代理 Gateway RPC) |
| GET | `/api/sessions` | ✓ | 会话列表 |
| GET | `/api/models` | ✓ | 模型列表 |

### 统一响应格式
```json
{ "code": 0, "message": "ok", "data": { ... } }
```

## 开发与部署

```bash
# 本地开发
cd server && npm run dev     # 后端 :8080
cd client && npm run dev     # 前端 :5173 (自动代理到 :8080)

# 构建
cd server && npm run build
cd client && npm run build   # 产物在 client/dist

# 生产运行 (后端自动托管前端静态文件)
cd server && npm start

# Docker (ARM64 Ubuntu 22.04)
docker compose up --build -d
```

## 版本历史

| 版本 | 提交 | 内容 |
|------|------|------|
| Phase 1 | `45d14cc` | 项目初始化 + JWT 登录 + 深色主题 |
| Phase 2 | `8e99325` | Gateway WS-RPC 桥接 + 状态检测 + WS 对话桥接 |
