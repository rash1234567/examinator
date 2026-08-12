FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY . .

RUN npm run build

EXPOSE 8989

CMD ["node", "dist/server.js"]