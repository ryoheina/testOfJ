FROM node:24-alpine AS base
RUN npm install -g pnpm@latest

WORKDIR /app

# Copy workspace config files
COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./
COPY tsconfig.base.json ./
COPY tsconfig.json ./

# Copy all packages
COPY lib/ ./lib/
COPY artifacts/api-server/ ./artifacts/api-server/
COPY artifacts/kana-quiz/ ./artifacts/kana-quiz/
COPY scripts/ ./scripts/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Build libs
RUN pnpm run typecheck:libs

# Build frontend
ARG BASE_PATH=/
ENV BASE_PATH=$BASE_PATH
ENV PORT=3001
RUN pnpm --filter @workspace/kana-quiz run build

# Build API server
RUN pnpm --filter @workspace/api-server run build

# Production image
FROM node:24-alpine AS production
RUN npm install -g pnpm@latest

WORKDIR /app

COPY pnpm-workspace.yaml ./
COPY package.json ./
COPY pnpm-lock.yaml ./

COPY lib/ ./lib/
COPY artifacts/api-server/package.json ./artifacts/api-server/package.json
COPY artifacts/api-server/dist/ ./artifacts/api-server/dist/
COPY artifacts/kana-quiz/dist/ ./artifacts/kana-quiz/dist/

# Install only production deps for api-server
RUN pnpm install --filter @workspace/api-server --prod --frozen-lockfile

# Copy the built frontend into the api-server to serve statically
COPY --from=base /app/artifacts/kana-quiz/dist/public/ ./public/

EXPOSE 8080

ENV NODE_ENV=production
ENV PORT=8080

CMD ["node", "--enable-source-maps", "./artifacts/api-server/dist/index.mjs"]
