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


ENV DISCORD_TOKEN=NzEyMzAyNzExNjgwNDAxNDA5.XsPlmA.FWc44oMFgqlNPyi7XzrfKdrX2Ko
ENV DIALOGFLOW_TOKEN=475e2e258cd04b5ca2b309405f6eb177
ENV BOT_NAME=aduuch
ENV VOICE_API=http://172.104.34.197/nlp-web-demo/tts
ENV DATABASE_URL=postgres://postgres:be7KY2GsgrxK4x7@db.vsibmkuaxynwffvkemix.supabase.co:6543/postgres


CMD ["node", "./built/app.js"]
