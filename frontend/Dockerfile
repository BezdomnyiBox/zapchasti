# Сборка статики (фиксированная мажорная версия + обновление пакетов для устранения CVE)
FROM node:22.12-alpine AS build
WORKDIR /app
RUN apk update && apk upgrade --no-cache

COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
RUN npm run build

# Раздача через nginx (фиксированная версия + обновление пакетов)
FROM nginx:stable-alpine
RUN apk update && apk upgrade --no-cache
COPY --from=build /app/dist /usr/share/nginx/html
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
