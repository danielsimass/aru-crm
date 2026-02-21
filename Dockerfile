FROM node:24-alpine

RUN npm install -g npm@10

RUN apk add --no-cache \
    dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nestjs -u 1001

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy dependency files first for better caching
COPY package*.json ./
COPY pnpm-lock.yaml ./

ENV npm_config_verify_deps_before_run false
ENV npm_config__jsr_registry ""

# Install dependencies
RUN pnpm install

# Copy rest of the files (will be overridden by volumes in docker-compose for dev)
COPY . .

EXPOSE 3000

# Use start:dev for hot reload
# Note: Running as root in dev for easier volume permissions
# In production, use a non-root user
CMD ["pnpm", "run", "start:dev"]