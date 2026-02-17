FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY shared/package.json ./shared/
COPY backend/package*.json ./backend/
COPY backend/prisma/ ./backend/prisma/

RUN npm install -w backend

COPY shared/ ./shared/
COPY backend/ ./backend/

WORKDIR /app/backend

EXPOSE 3000
CMD ["npm", "run", "start:dev"]
