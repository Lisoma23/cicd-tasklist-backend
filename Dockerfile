FROM node:24-alpine AS installer

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

FROM node:24-alpine AS builder

WORKDIR /app

COPY --from=installer /app/node_modules ./node_modules
COPY . .

RUN npm run build


FROM node:24-alpine AS runner

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=installer /app/node_modules ./node_modules

CMD ["node", "dist/server.js"]