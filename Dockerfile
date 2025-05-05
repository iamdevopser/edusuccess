FROM node:18-alpine

WORKDIR /app

# Install necessary tools
RUN apk add --no-cache netcat-openbsd

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application
COPY . .

# Make the entrypoint script executable
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Build the application (optional for production builds)
# RUN npm run build

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

EXPOSE 5000

# Set the entrypoint script
ENTRYPOINT ["docker-entrypoint.sh"]

# Command to run the application (this will be passed to the entrypoint)
CMD ["npm", "run", "dev"]