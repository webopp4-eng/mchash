FROM node:22-alpine
WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm install --production

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 4000
CMD ["node", "dist/index.js"]
