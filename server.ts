/**
 * Created by wlh on 2017/11/15.
 */

'use strict';
import http = require("http");
import app from './app';
import config = require("@jingli/config");

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
import * as fs from 'fs';
import * as path from 'path';

function isNeedInitData() {
    let expireTime = Date.now() + 10 * 24 * 60 * 60 * 1000;
    let lockFile = path.join(config.dataDir,'cache.lock');
    //不存在时需要创建
    if (!fs.existsSync(lockFile)) {
        fs.writeFileSync(lockFile, expireTime);
        return true;
    }
    //日期失效时需要创建
    let d: string|number = fs.readFileSync(lockFile, 'utf8');
    try {
        d = Number(d);
        if (d && Date.now() > d) {
            fs.writeFileSync(lockFile, expireTime);
            return true;
        }
    } catch(err) {
        fs.writeFileSync(lockFile, expireTime);
        return true;
    }
    //不需要创建
    return false;
}

async function main() {
    await database.DB.sync({force: false})
    if (isNeedInitData()) {
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