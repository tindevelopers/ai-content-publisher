# Multi-stage build for AI Content Publisher SDK
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the project
RUN npm run build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/README.md ./
COPY --from=builder /app/LICENSE ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S aicontentpublisher -u 1001

# Change ownership of the app directory
RUN chown -R aicontentpublisher:nodejs /app
USER aicontentpublisher

# Make CLI executable
RUN chmod +x /app/dist/cli/cli.js

# Create symlink for global access
USER root
RUN ln -s /app/dist/cli/cli.js /usr/local/bin/ai-publisher
USER aicontentpublisher

# Set environment variables
ENV NODE_ENV=production
ENV PATH="/app/dist/cli:${PATH}"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "console.log('AI Content Publisher SDK is running')" || exit 1

# Default command
CMD ["node", "dist/cli/cli.js", "--help"]

# Labels for better container management
LABEL maintainer="Your Organization"
LABEL description="AI Content Publisher SDK - Publish AI-generated content to Webflow and WordPress"
LABEL version="1.0.0"
