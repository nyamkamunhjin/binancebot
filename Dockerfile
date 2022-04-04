FROM mhart/alpine-node:14 AS builder
WORKDIR /app
COPY package.json ./
RUN yarn install --frozen-lockfile

COPY . .

RUN yarn prisma generate
RUN yarn build
RUN npm prune --production

FROM mhart/alpine-node:slim-14

COPY --from=builder /app/built ./built
COPY --from=builder /app/node_modules ./node_modules


ENV DISCORD_TOKEN=*
ENV DIALOGFLOW_TOKEN=*
ENV BOT_NAME=aduuch
ENV VOICE_API=http://172.104.34.197/nlp-web-demo/tts
ENV DATABASE_URL=*


CMD ["node", "./built/app.js"]
