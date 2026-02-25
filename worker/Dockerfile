FROM node:20-alpine
WORKDIR /app
# We need Chrome for Puppeteer later, so we install the dependencies now
RUN apk add --no-cache chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
