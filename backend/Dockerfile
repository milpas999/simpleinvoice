# syntax=docker/dockerfile:1

# =============================================================================
# base — shared dependency layer
# =============================================================================
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# =============================================================================
# development — used by docker-compose for local dev with hot reload.
# Source is bind-mounted over this at runtime; the COPY here just lets the
# image run standalone too.
# =============================================================================
FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "start:dev"]

# =============================================================================
# build — compiles TypeScript for production
# =============================================================================
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# =============================================================================
# production — minimal runtime image with only prod dependencies + compiled JS
# =============================================================================
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
EXPOSE 3000
CMD ["node", "dist/main"]
