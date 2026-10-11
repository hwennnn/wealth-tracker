# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

ARG VITE_CLERK_PUBLISHABLE_KEY
ARG VITE_EXCHANGE_RATE_API_KEY

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Serve with nginx (~25MB final image)
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
