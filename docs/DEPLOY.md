# OpenClaw Web Control Panel — 部署指南

## 环境要求

- Ubuntu 22.04+ (ARM64 或 AMD64)
- Docker 24+ 和 Docker Compose v2+
- OpenClaw Gateway 运行在 `localhost:18789`

## 快速部署 (Docker)

```bash
# 1. 克隆仓库
git clone https://github.com/lt20180918/localclaw.git
cd localclaw

# 2. 配置环境变量
cp .env.example .env
nano .env   # 修改 JWT_SECRET 和 ADMIN_PASSWORD

# 3. 构建并启动
docker compose up --build -d

# 4. 查看日志
docker compose logs -f web

# 5. 访问
# http://<服务器IP>:8080
```

## 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `8080` | Web 面板端口 |
| `JWT_SECRET` | `dev-secret-change-me` | **生产环境必须修改** |
| `ADMIN_PASSWORD` | `admin123` | 管理密码 (首次启动加密存储) |
| `OPENCLAW_GATEWAY_URL` | `ws://127.0.0.1:18789` | Gateway WS-RPC 地址 |
| `OPENCLAW_GATEWAY_TOKEN` | (空) | Gateway 认证 Token |
| `DB_PATH` | `./data/localclaw.db` | SQLite 数据库路径 |

> ⚠️ **安全提醒**: 生产环境务必修改 `JWT_SECRET` 为随机长字符串

## Docker 内部网络

容器通过 `host.docker.internal` 访问宿主机上的 OpenClaw Gateway:

```
容器 → host.docker.internal:18789 → 宿主机 OpenClaw Gateway
```

如果 Gateway 运行在其他机器，直接修改 `OPENCLAW_GATEWAY_URL`:

```bash
OPENCLAW_GATEWAY_URL=ws://192.168.1.100:18789
```

## 常用命令

```bash
# 停止
docker compose down

# 重启
docker compose restart

# 更新版本
git pull
docker compose up --build -d

# 查看状态
docker compose ps

# 进入容器调试
docker compose exec web sh

# 备份数据
docker compose cp web:/app/data/localclaw.db ./backup.db
```

## 不用 Docker (裸机部署)

```bash
# 安装 Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 构建
cd server && npm ci && npm run build
cd ../client && npm ci && npm run build

# 配置
cp .env.example .env
nano .env

# 启动
cd server && NODE_ENV=production node dist/index.js

# 推荐使用 PM2 管理进程
npm install -g pm2
cd server && pm2 start dist/index.js --name openclaw-web
pm2 save && pm2 startup
```

## 反向代理 (Nginx)

```nginx
server {
    listen 80;
    server_name openclaw.example.com;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 故障排查

| 问题 | 排查方法 |
|------|----------|
| Gateway 连接失败 | 检查 Gateway 是否在 `:18789` 运行, Docker 内用 `host.docker.internal` |
| 登录失败 | 检查 `.env` 中的 `ADMIN_PASSWORD`, 首次启动才会写入 |
| 需要重置密码 | 删除 `data/localclaw.db` 后重启 |
| 端口冲突 | 修改 `.env` 和 `docker-compose.yml` 中的端口映射 |
