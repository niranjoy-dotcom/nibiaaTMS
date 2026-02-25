# Build Stage
FROM node:18-alpine as build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Serve Stage
FROM node:18-alpine

WORKDIR /app

# Install 'serve' package
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build /app/dist /app/dist

EXPOSE 80

# Run serve on port 80, single-page app mode (-s)
CMD ["serve", "-s", "dist", "-l", "80"]
