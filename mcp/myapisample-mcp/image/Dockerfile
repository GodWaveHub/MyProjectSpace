FROM node:20-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
ENV DOCS_DIR=/workdir/mcp/myapisample-mcp/mydata/docs
ENV SAMPLES_DIR=/workdir/mcp/myapisample-mcp/mydata/samples
CMD ["npm", "start"]