# ═══════════════════════════════════════════════
#  OpenClaw Web Control Panel — Multi-stage Build
#  支持 ARM64 (aarch64) + AMD64
# ═══════════════════════════════════════════════

# ─── Stage 1: Build Frontend ───
FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package.json client/package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY client/ ./
RUN npm run build

# ─── Stage 2: Build Backend ───
FROM node:20-alpine AS server-build

WORKDIR /app/server
COPY server/package.json server/package-lock.json* ./
RUN npm ci --no-audit --no-fund
COPY server/ ./
RUN npm run build

# ─── Stage 3: Production Runtime ───
FROM node:20-alpine AS production

LABEL maintainer="lt20180918"
LABEL description="OpenClaw Web Control Panel"

WORKDIR /app

# 仅安装生产依赖
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm ci --omit=dev --no-audit --no-fund && npm cache clean --force

# 复制编译产物
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=client-build /app/client/dist ./client/dist

# 数据目录
RUN mkdir -p /app/data

# 环境变量默认值
ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/app/data/localclaw.db
ENV OPENCLAW_GATEWAY_URL=ws://host.docker.internal:18789

EXPOSE 8080

# 数据卷 (持久化数据库)
VOLUME ["/app/data"]

# 启动
CMD ["node", "server/dist/index.js"]
