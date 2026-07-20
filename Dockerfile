FROM node:24-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/* \
    && npm install --global pnpm@11.9.0

WORKDIR /app

FROM base AS builder

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build

FROM base AS runtime

ENV NODE_ENV="production"
ENV HOST="0.0.0.0"
ENV PORT="3000"

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node .output/server/index.mjs"]
