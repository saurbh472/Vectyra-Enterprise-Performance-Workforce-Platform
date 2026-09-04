# ═══════════════════════════════════════════════════════════════════════
# VECTYRA — UNIFIED PRODUCTION DOCKERFILE
# Runs both Frontend (Static SPA Assets) and Backend (Node/Express REST API)
# in a single, secure, lightweight containerized environment.
# ═══════════════════════════════════════════════════════════════════════

FROM node:20-alpine AS base

# Install curl for container healthcheck
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Set default production environment variables
ENV NODE_ENV=production \
    PORT=3000 \
    HOST=0.0.0.0

# Copy dependency manifests
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production --ignore-scripts && npm cache clean --force

# Copy all application assets, backend server, and database schema
COPY server.js ./
COPY index.html ./
COPY schema.sql ./
COPY js ./js
COPY styles ./styles

# Set non-root ownership for security
RUN chown -R node:node /app

# Switch to non-root user
USER node

# Expose the application port
EXPOSE 3000

# Health check to ensure Express server responds
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start the unified application
CMD ["node", "server.js"]
