FROM dk.jingli365.com/jl-run:v2
MAINTAINER Wanglihui <lihui.wang@jingli365.com>
WORKDIR /opt/app
COPY package.json ./
RUN npm --registry https://repo.jingli365.com/repository/npm/ install --production && rm -rf ~/.npm
COPY dist/ /opt/app/
CMD node main.js