# 
FROM 20.5.1-alpine3.18

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH

COPY ./package.json /app/

RUN node install

COPY . /app/

CMD ["node", "server.js"]