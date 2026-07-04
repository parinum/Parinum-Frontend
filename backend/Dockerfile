FROM node:20-bookworm-slim AS deps
WORKDIR /app

# The contracts dependency is pulled from a private GitHub repo, so Docker builds
# need BuildKit SSH forwarding: docker build --ssh default -f backend/Dockerfile .
RUN apt-get update \
  && apt-get install -y --no-install-recommends git openssh-client \
  && rm -rf /var/lib/apt/lists/*

COPY package.json ./
COPY backend/tsconfig.json ./backend/tsconfig.json
COPY backend/src ./backend/src
COPY lib/deploymentAddresses.json ./lib/deploymentAddresses.json

RUN --mount=type=ssh npm install

FROM deps AS build
RUN npm run backend:build

FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=deps /app/package.json ./package.json
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=deps /app/lib/deploymentAddresses.json ./lib/deploymentAddresses.json

EXPOSE 4100

CMD ["node", "backend/dist/main.js"]