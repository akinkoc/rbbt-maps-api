FROM nginx
COPY ngnix/nginx.conf /etc/nginx/nginx.conf

FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
RUN npm install --global pm2
COPY . .
ENV PORT=80
EXPOSE 80
CMD [ "pm2-runtime", "start", "npm", "--", "start" ]
