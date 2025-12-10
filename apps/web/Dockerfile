## Multi-stage Dockerfile to build and serve an Angular app with Nginx

# ====== Build stage ======
FROM node:20-alpine AS build

WORKDIR /app

# Enable corepack and prepare the exact pnpm version from package.json (pnpm@10.22.0)
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Copy only package manager files first for better layer caching
COPY package.json pnpm-lock.yaml .npmrc* .pnpmfile.cjs* ./

# Install dependencies (no scripts) using frozen lockfile for reproducible builds
RUN pnpm install --frozen-lockfile

# Copy the rest of the project sources
COPY . .

# Build the Angular app (production by default via angular.json)
RUN pnpm run build


# ====== Runtime stage ======
FROM nginx:alpine AS runtime

# Copy our Nginx config (with SPA fallback)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built static files to Nginx html directory
COPY --from=build /app/dist/browser/ /usr/share/nginx/html/

# Expose HTTP
EXPOSE 80

# Healthcheck (optional but useful)
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD wget -qO- http://127.0.0.1/ > /dev/null || exit 1

# Start Nginx in the foreground
CMD ["nginx", "-g", "daemon off;"]
