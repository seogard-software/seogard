FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# Install dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production && yarn add playwright@1.58.2 tsx

# Copy crawler + shared code + server modules (needed by crawler)
COPY crawler/ ./crawler/
COPY shared/ ./shared/
COPY server/database/ ./server/database/
COPY server/utils/ ./server/utils/
# Wording des regles, lu a l'execution. Sans ce COPY le worker ne demarre pas.
COPY i18n/ ./i18n/

CMD ["npx", "tsx", "crawler/index.ts"]
