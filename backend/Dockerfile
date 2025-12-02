FROM node:22-alpine
WORKDIR /app

# Copiar dependencias
COPY package*.json ./
RUN npm install

# Copiar código
COPY . .

# Exponer puerto
EXPOSE 3000

# Comando (en producción usa "node src/app.js", en desarrollo "npm run dev")
CMD ["npm", "run", "dev"]