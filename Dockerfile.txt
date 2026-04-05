FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev && npm install tsx
COPY --from=builder /app/dist ./dist
COPY server.ts tsconfig.json types.ts constants.ts ./
COPY firebase-applet-config.json* ./
COPY services/ ./services/
COPY functions/ ./functions/
ENV PORT=8080
ENV NODE_ENV=production
EXPOSE 8080
CMD ["npx", "tsx", "server.ts"]