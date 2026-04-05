# ================================
# Stage 1: Build frontend (Vite)
# ================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy semua source code
COPY . .

# Build frontend Vite
RUN npm run build

# ================================
# Stage 2: Production server
# ================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install hanya production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Install tsx untuk jalankan TypeScript langsung
RUN npm install tsx

# Copy hasil build frontend
COPY --from=builder /app/dist ./dist

# Copy source server dan file yang dibutuhkan
COPY server.ts ./
COPY tsconfig.json ./
COPY types.ts ./
COPY constants.ts ./
COPY firebase-applet-config.json ./

# Copy folder lain yang dibutuhkan server
COPY services/ ./services/
COPY functions/ ./functions/

# Port yang dipakai Cloud Run (wajib 8080 atau sesuai PORT env)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Jalankan server langsung dengan tsx
CMD ["npx", "tsx", "server.ts"]
