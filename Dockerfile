FROM node:22-bookworm-slim
RUN corepack enable && corepack prepare pnpm@10.15.1 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc* ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
ENV NODE_ENV=production
EXPOSE 3000
CMD ["pnpm", "start"]
