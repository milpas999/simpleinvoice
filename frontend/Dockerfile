# syntax=docker/dockerfile:1

# =============================================================================
# base — shared dependency layer
# =============================================================================
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# =============================================================================
# development — used by docker-compose for local dev with Vite HMR.
# Source is bind-mounted over this at runtime; the COPY here just lets the
# image run standalone too.
# =============================================================================
FROM base AS development
ENV NODE_ENV=development
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]

# =============================================================================
# build — produces the static production bundle
# =============================================================================
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# =============================================================================
# production — static bundle served by nginx
# =============================================================================
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
