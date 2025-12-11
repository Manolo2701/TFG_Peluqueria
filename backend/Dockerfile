FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN rm -f .env 2>/dev/null || true

EXPOSE 3000

CMD ["node", "src/app.js"]