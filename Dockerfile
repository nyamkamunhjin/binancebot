FROM mhart/alpine-node:14 AS builder
WORKDIR /app
COPY package.json ./
RUN yarn install --frozen-lockfile

COPY . .

# RUN yarn prisma generate
RUN npm run build
RUN npm prune --production

FROM mhart/alpine-node:slim-14

COPY --from=builder /app/built ./built
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 8083

CMD ["node", "./built/app.js"]
