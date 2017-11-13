/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

import http = require("http");
import app from './app';
import config = require("@jingli/config");

import Logger from "@jingli/logger";
Logger.init(config.logger);
const logger = new Logger("main");

import database = require("@jingli/database");
database.init(config.postgres.url);
import "./model";
async function main() {
    await database.DB.sync({force: false})
    const server = http.createServer(app);
    server.on('listening', function() {
        logger.log(`server start on ${port}...`);
        logger.log(`SERVER INITIALIZED`);
    })
    const port = config.listen;
    server.listen(port);
    return server;
}

main()
.catch( (err) => {
    throw err;
})