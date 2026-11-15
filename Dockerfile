# syntax=docker/dockerfile:1.7
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_EXCHANGE_RATE_API_KEY

# Dependencies are their own layer: reused until package-lock.json changes.
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# Stage 2: Serve with nginx (~25MB final image)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
