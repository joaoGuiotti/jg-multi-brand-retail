# ==========================================
# Stage: Build
# ==========================================
FROM node:24-alpine AS build
WORKDIR /app

# Copy root configs and lockfile
COPY package.json package-lock.json nx.json tsconfig.base.json ./
COPY apps/frontend/package.json ./apps/frontend/
COPY apps/backend/package.json ./apps/backend/
COPY libs/ui/package.json ./libs/ui/
RUN npm ci

# Copy shared UI library and frontend source code
COPY libs/ui ./libs/ui
COPY apps/frontend ./apps/frontend

RUN npx nx run frontend:build --configuration=production

# ==========================================
# Stage: Runtime
# ==========================================
FROM nginx:1.27-alpine AS runtime

COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/frontend/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
