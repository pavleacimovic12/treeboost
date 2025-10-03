# NeuralDoc Intelligent Document Platform
# Multi-stage production-ready Docker build

# Stage 1: Build dependencies and application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install system dependencies for document processing
RUN apk add --no-cache \
    python3 \
    py3-pip \
    build-base \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev \
    librsvg-dev \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-data-eng

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./

# Install ALL dependencies (including vite for building)
RUN npm ci && npm cache clean --force

# Copy source code
COPY client/ ./client/
COPY server/ ./server/
COPY shared/ ./shared/

# Build application (requires vite)
RUN npm run build

# Stage 2: Production runtime
FROM node:20-alpine AS runtime

# Install runtime dependencies
RUN apk add --no-cache \
    poppler-utils \
    tesseract-ocr \
    tesseract-ocr-data-eng \
    dumb-init

# Create app user
RUN addgroup -g 1001 -S neuraldoc && \
    adduser -S neuraldoc -u 1001

# Set working directory
WORKDIR /app

# Copy package files for production install
COPY package*.json ./

# Install production dependencies plus drizzle-kit for migrations
RUN npm ci --only=production && \
    npm install drizzle-kit --save-dev && \
    npm cache clean --force

# Copy built application from builder
COPY --from=builder --chown=neuraldoc:neuraldoc /app/dist ./dist

# Copy database schema and drizzle config for migrations
COPY --chown=neuraldoc:neuraldoc shared/ ./shared/
COPY --chown=neuraldoc:neuraldoc drizzle.config.ts ./

# Copy entrypoint script
COPY --chown=neuraldoc:neuraldoc docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Create uploads directory
RUN mkdir -p uploads && chown neuraldoc:neuraldoc uploads

# Switch to non-root user
USER neuraldoc

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "const http = require('http'); \
    http.get('http://localhost:5000/health', (res) => { \
        process.exit(res.statusCode === 200 ? 0 : 1); \
    }).on('error', () => process.exit(1));"

# Start application with dumb-init and entrypoint script
ENTRYPOINT ["dumb-init", "--"]
CMD ["./docker-entrypoint.sh", "node", "dist/index.js"]
