FROM node:lts-alpine

WORKDIR /app

RUN apk update && apk add git
RUN git clone https://github.com/drakosha/ip2location.git /app
RUN npm install

RUN mkdir -p /data

ENTRYPOINT ["node", "index.js"]
