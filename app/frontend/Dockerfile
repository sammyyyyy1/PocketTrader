FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --silent

COPY . .
# copy entrypoint script that ensures node_modules exists in container
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
CMD ["npm", "run", "dev"]