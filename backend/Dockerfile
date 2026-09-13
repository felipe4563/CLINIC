FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 4000
CMD ["sh", "-c", "npx sequelize-cli db:migrate && node src/server.js"]
