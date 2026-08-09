FROM node:22-alpine AS deps
WORKDIR /usr/src/app
COPY package.json package-lock.json* ./
RUN npm install --production

FROM node:22-alpine AS builder
WORKDIR /usr/src/app
COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package.json ./
COPY tsconfig.json next.config.mjs postcss.config.js tailwind.config.js .
COPY app ./app
COPY components ./components
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /usr/src/app
ENV NODE_ENV=production
COPY --from=builder /usr/src/app/.next ./.next
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/package.json ./package.json
COPY --from=builder /usr/src/app/public ./public
EXPOSE 3000
CMD ["npm", "start"]
