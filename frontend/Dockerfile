# Build stage
FROM node:18-alpine AS build

# Set working directory in the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy remaining files 
COPY . .

# Build the app
RUN npm run build

# Production stage using nginx 
FROM nginx:alpine

# Copy built files to nginx html directory
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start nginx.
CMD ["nginx", "-g", "daemon off;"]