FROM node:18 AS builder
WORKDIR /app
COPY package.json ./
RUN yarn install --frozen-lockfile

COPY . .

# RUN yarn prisma generate
RUN npm run build
RUN npm prune --production

FROM node:18

COPY --from=builder /app/built ./built
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 80

CMD ["node", "./built/app.js"]
