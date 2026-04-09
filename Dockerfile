FROM node:22-slim AS build

WORKDIR /app

COPY package.json yarn.lock ./
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
RUN yarn install --frozen-lockfile

COPY . .
# timeout guards against hanging process (pino transport / sqlite)
# build completes in ~20s, then we verify output exists
RUN timeout 120 yarn build || test -f .output/server/index.mjs

FROM node:22-slim

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/.output .output
COPY --from=build /app/package.json .

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
