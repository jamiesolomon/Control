# 
FROM node:20.5.1-alpine3.18

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY ./package.json /app/

RUN npm install

COPY . /app/

CMD ["node", "server.js"]