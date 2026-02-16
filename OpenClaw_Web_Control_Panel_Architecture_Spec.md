# OpenClaw Web Control Panel

## 完整架构设计 + 开发需求说明文档

------------------------------------------------------------------------

## 一、项目定位

OpenClaw Web Control Panel 是一个部署在无头局域网服务器上的 Web
控制面板， 用于管理 OpenClaw
Agent、进行对话、查看状态与日志，并支持独立升级。

特点：

-   无头服务器部署
-   局域网多端访问（http://ip:port）
-   响应式自适应 UI（手机 / 平板 / 桌面）
-   不侵入 OpenClaw 本体
-   保留原生 Dashboard
-   OpenClaw 与 GUI 独立升级

------------------------------------------------------------------------

## 二、总体架构设计

    无头服务器
    │
    ├── Web Control Panel (REST + WebSocket + Auth)
    │        │
    │        └── OpenClaw Controller (CLI Wrapper / HTTP Client)
    │                     │
    │                     └── OpenClaw Core
    │
    └── 局域网访问 http://ip:port

分层说明：

1.  前端 SPA（React / Vue）
2.  后端 API 服务（Node.js / FastAPI）
3.  OpenClaw 调用封装层
4.  OpenClaw Core（保持独立）

------------------------------------------------------------------------

## 三、核心功能需求

### 1. 服务状态管理

API: GET /api/status

返回示例：

{ "openclawRunning": true, "openclawVersion": "2026.x", "webVersion":
"1.0.0" }

功能要求：

-   启动 Web 服务时自动检测 OpenClaw
-   未运行时可自动尝试启动
-   提供健康检查

------------------------------------------------------------------------

### 2. 登录与认证

-   单管理员密码登录
-   JWT Token 验证
-   所有 API 必须认证

API: POST /api/login

------------------------------------------------------------------------

### 3. Agent 管理

API 列表：

GET /api/agents\
POST /api/agents\
DELETE /api/agents/:id\
POST /api/agents/:id/start\
POST /api/agents/:id/stop

------------------------------------------------------------------------

### 4. 对话功能（WebSocket）

WebSocket 路径：

ws://ip:port/ws

客户端发送：

{ "type": "chat", "agentId": "default", "message": "hello" }

服务器返回：

{ "type": "message", "agentId": "default", "content": "Hi" }

要求：

-   支持流式返回
-   自动重连
-   多客户端同步

------------------------------------------------------------------------

### 5. 原生 Dashboard 入口

方式一：直接跳转

http://server-ip:9000

方式二：反向代理

/dashboard → localhost:9000

------------------------------------------------------------------------

### 6. 升级机制

#### OpenClaw 升级

POST /api/openclaw/update

流程：

-   停止服务
-   备份配置
-   执行升级
-   重启服务

#### Web GUI 升级

-   检查远程版本 JSON
-   提示更新
-   支持 Docker 更新或 git pull

------------------------------------------------------------------------

## 四、响应式 UI 设计

断点规范：

-   \<640px：手机单栏

-   640--1024px：折叠侧栏

-   1024px：三栏布局

-   1440px：扩展信息布局

桌面结构：

Agents \| Chat \| Status

手机结构：

\[☰\] 顶部导航\
Chat 全屏\
底部固定输入框

必须实现：

-   Drawer 侧边栏
-   固定底部输入框
-   Markdown 渲染
-   代码块横向滚动
-   深色主题
-   使用 100dvh

------------------------------------------------------------------------

## 五、OpenClaw 调用封装规范

openclawController.ts 方法：

getVersion()\
isRunning()\
startService()\
stopService()\
listAgents()\
createAgent(config)\
deleteAgent(id)\
startAgent(id)\
stopAgent(id)\
sendMessage(agentId, message)\
getLogs()

内部通过：

-   child_process.exec\
    或\
-   本地 HTTP API

------------------------------------------------------------------------

## 六、安全要求

必须实现：

-   JWT 验证
-   请求限流
-   访问日志
-   可选 IP 白名单
-   未授权访问禁止

------------------------------------------------------------------------

## 七、部署建议

推荐 Docker Compose：

services: openclaw: image: openclaw:latest

web-control-panel: build: . ports: - "8080:8080" depends_on: - openclaw

------------------------------------------------------------------------

## 八、数据持久化

建议保存：

-   登录密码（加密）
-   UI 配置
-   对话历史（可选）

存储方式：

-   SQLite 或 JSON 文件

------------------------------------------------------------------------

## 九、项目目录建议

/server index.ts routes/ controllers/ openclawController.ts auth.ts
websocket.ts

/client components/ pages/ hooks/ App.tsx

------------------------------------------------------------------------

## 十、实现优先顺序

1.  Web 服务 + 登录
2.  OpenClaw 状态检测
3.  Agent 管理 API
4.  WebSocket 对话
5.  响应式 UI
6.  升级机制
7.  日志系统
8.  Docker 化

------------------------------------------------------------------------

## 结束

本系统目标：

在手机或电脑浏览器输入：

http://192.168.x.x:8080

即可管理 OpenClaw，无需 SSH 或 CLI。
