FROM node:24-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="${PNPM_HOME}:$PATH"
RUN corepack enable

WORKDIR /app

COPY package.json .
COPY pnpm-lock.yaml .

FROM base AS all-deps

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

FROM all-deps AS builder

COPY public ./public
COPY index.html .
COPY tsconfig.json .
COPY vite.config.ts .
COPY src ./src

RUN pnpm run build

FROM base AS prod

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist /app/dist

# TODO serve from apache instead of vite, can move vite back to dev-deps once this done
CMD [ "pnpm", "serve", "--host", "0.0.0.0" ]

FROM all-deps AS dev

COPY public ./public
COPY index.html .
COPY tsconfig.json .
COPY vite.config.ts .
COPY src ./src

CMD [ "pnpm", "dev", "--host", "0.0.0.0" ]
