/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

import http = require("http");
import app from './app';
import config = require("@jingli/config");

const server = http.createServer(app);
const port = config.listen
server.on('listening', function() {
    console.log(`server start on ${port}...`);
})

server.listen(port);