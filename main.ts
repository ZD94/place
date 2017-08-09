/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

import http = require("http");
import app from './app';
import config = require("@jingli/config");

import Logger from "@jingli/logger";
Logger.init({});

import database = require("@jingli/database");
database.init(config.postgres.url);
import "./model";
database.DB.sync({force: false});

const server = http.createServer(app);
const port = config.listen
server.on('listening', function() {
    console.log(`server start on ${port}...`);
})

server.listen(port);

// import './tools/test';