# Multi-stage Dockerfile for Twitter Sentiment Analysis App
# Stage 1: Build frontend
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# Stage 2: Backend with Python support
FROM node:18-alpine

# Install Python3 and pip for ML dependencies
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Install Python ML dependencies
COPY ml/requirements.txt ./ml/
RUN pip3 install --no-cache-dir -r ml/requirements.txt

# Install backend dependencies
COPY backend/package*.json ./backend/
RUN cd backend && npm ci --production

# Copy application files
COPY backend/ ./backend/
COPY ml/ ./ml/

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port
EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Start the backend server
CMD ["node", "backend/server.js"]
