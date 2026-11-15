# syntax=docker/dockerfile:1.7
# Build context is the repo root: the server reuses src/lib (net worth, regions, money).
FROM node:20-alpine AS build
WORKDIR /repo/mcp
COPY mcp/package.json mcp/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY src/lib /repo/src/lib
COPY mcp/ ./
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /repo/mcp/dist/server.mjs ./server.mjs
USER node
EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3001/health || exit 1
CMD ["node", "server.mjs"]
