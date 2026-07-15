FROM node:18-alpine

WORKDIR /app

# Копируем package.json и устанавливаем зависимости
COPY package.json ./
RUN npm install --omit=dev

# Копируем остальные файлы
COPY server.js ./
COPY index.html ./
COPY css/ ./css/
COPY js/ ./js/
COPY assets/ ./assets/

EXPOSE 3000

CMD ["node", "server.js"]
