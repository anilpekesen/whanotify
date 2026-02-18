FROM node:20-slim

WORKDIR /app

# Install dependencies for better-sqlite3 native build
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDeps for build)
RUN npm install

# Copy source code
COPY . .

# Build the app
RUN npm run build

# Remove devDependencies after build to reduce image size
RUN npm prune --production

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "./build/server/index.js"]
