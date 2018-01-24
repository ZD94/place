/**
 * Created by wlh on 2017/11/15.
 */

'use strict';
import fs = require("fs");
import http = require("http");
import app from './app';
import config = require("@jingli/config");
import cluster = require("cluster");

import Logger from "@jingli/logger";
const logger = new Logger("main");

import database = require("@jingli/database");
database.init(config.postgres.url);
import cache from '@jingli/cache';
cache.init({redis_conf: config.redis, prefix: config.appName});

import "./model";
import * as cityIdCache from './service/cache';
import * as tableNameWithIdCache from './service/cache-table';

import { sendSuccssMsgToCluster, WORKER_BOOT_STATUS } from "@jingli/server";
async function main() {
    await database.DB.sync({force: false})
    if (cluster.isMaster) {
        cityIdCache.init()
            .catch( (err) => {
                logger.error('加载新旧ID对应关系缓存时报错:', err.stack);
            })
        tableNameWithIdCache.init()
            .catch( (err) => {
                logger.error('加载ID与表明关系:', err.stack);
            })
    }
    const server = http.createServer(app);
    const port = config.listen;
    
    server.on('listening', function() {
        logger.log(`server start on ${port}...`);
        sendSuccssMsgToCluster(WORKER_BOOT_STATUS.SUCCSSED);
        if (!/^\d+$/.test(port)) {
            fs.chmodSync(port, '777');
        }
    })
    server.on('error', (err) => {
        console.error(err);
        sendSuccssMsgToCluster(WORKER_BOOT_STATUS.FAILED);
    });
    server.listen(port);
    return server;
}

main()  
    .catch((err) => {
        sendSuccssMsgToCluster(WORKER_BOOT_STATUS.FAILED);
        throw err;
    })