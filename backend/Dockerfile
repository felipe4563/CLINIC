FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache tzdata
COPY package*.json ./
RUN npm install --production
COPY . .
RUN chmod +x docker-entrypoint.sh
EXPOSE 4000
CMD ["./docker-entrypoint.sh"]
