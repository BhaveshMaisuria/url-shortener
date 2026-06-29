# ==========================================
# STAGE 1: BUILDER
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./

RUN apk add --no-cache python3 make g++

RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# ==========================================
# STAGE 2: PRODUCTION
# ==========================================
FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./

RUN apk add --no-cache python3 make g++

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/main.js"]