FROM dk.jingli365.com/jl-run:v3
MAINTAINER Wanglihui <lihui.wang@jingli365.com>
ARG NPM_TOKEN
ENV NPM_TOKEN $NPM_TOKEN
WORKDIR /opt/app
COPY package.json ./
RUN npm install --production && rm -rf ~/.npm
COPY dist/ /opt/app/
CMD node main.js