# syntax=docker/dockerfile:1

FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY index.html tsconfig.json vite.config.ts ./
COPY src ./src
RUN npm run build

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=8787 \
    HOST=0.0.0.0 \
    NPM_CONFIG_CACHE=/tmp/.npm

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
    && npm cache clean --force

COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node server ./server
COPY --chown=node:node scripts ./scripts

USER node

EXPOSE 8787

CMD ["npm", "start"]
