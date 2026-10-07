# ==========================================
# Base Image (Node 24 aligned with .nvmrc)
# ==========================================
FROM node:24-alpine AS base
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app

# ==========================================
# Stage: Dependencies (all deps for building)
# ==========================================
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ==========================================
# Stage: Build
# ==========================================
FROM deps AS build
COPY . .
RUN npx prisma generate && npm run build

# ==========================================
# Stage: Migrate (runs prisma migrate deploy)
# ==========================================
FROM build AS migrate
CMD ["npx", "prisma", "migrate", "deploy"]

# ==========================================
# Stage: Production Dependencies
# Prunes devDependencies and strips non-runtime artifacts (CLI engines, dev tools, unused template engines)
# ==========================================
FROM deps AS prod-deps
RUN npm prune --omit=dev && \
    rm -rf /app/node_modules/@prisma/engines \
           /app/node_modules/prisma \
           /app/node_modules/typescript \
           /app/node_modules/prettier \
           /app/node_modules/@types \
           /app/node_modules/swagger-ui-dist \
           /app/node_modules/elkjs \
           /app/node_modules/react \
           /app/node_modules/react-dom \
           /app/node_modules/@babel \
           /app/node_modules/@visx \
           /app/node_modules/caniuse-lite \
           /app/node_modules/svgo \
           /app/node_modules/csso \
           /app/node_modules/terser \
           /app/node_modules/cheerio* \
           /app/node_modules/mjml* \
           /app/node_modules/pug* \
           /app/node_modules/liquidjs* \
           /root/.npm

# ==========================================
# Stage: Runtime
# ==========================================
FROM base AS runtime
ENV NODE_ENV=production
ENV PORT=3000

# Copy production node_modules and Prisma client artifacts
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma/client ./node_modules/@prisma/client
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "const net = require('net'); const client = net.connect({port: process.env.PORT || 3000, host: '127.0.0.1'}, () => { client.end(); process.exit(0); }); client.on('error', () => process.exit(1));"

CMD ["node", "dist/src/main.js"]
