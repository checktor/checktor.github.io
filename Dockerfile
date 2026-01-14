FROM docker.io/node:24-alpine AS build
WORKDIR /home/node
COPY . .
RUN npm ci
RUN npx ng build

FROM docker.io/nginxinc/nginx-unprivileged:1.29-alpine
ENV TZ=Europe/Berlin
EXPOSE 4200
COPY --chown=nginx:nginx nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=nginx:nginx /home/node/dist/app/browser /var/cache/nginx
USER nginx
CMD ["nginx", "-g", "daemon off;"]
