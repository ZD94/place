/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

import path = require("path");
import * as express from "express";
import * as Express from 'express-serve-static-core';
const app = express();
import { registerControllerToRouter, scannerDecoration, reply } from '@jingli/restful';
const bodyParser = require('body-parser')
import { init, IntervalError, CustomerError } from '@jingli/error';
import Logger from '@jingli/logger';
const logger = new Logger('http');
//初始化错误语言包
init({
    default: 'zh',
    langs: ['zh', 'en'],
});


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))


app.use('/manager', function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT,GET,POST,OPTIONS,DELETE')
    res.header('Access-Control-Allow-Headers', 'Content-Type')
    if (req.method.toLowerCase() == 'options')
        return res.sendStatus(200)
    if (req.query.key !== 'test1512967479893') {
        return res.send(403);
    }
    next();
})

scannerDecoration(path.join(__dirname, 'controller'), [/\d\.ts$/, /\.js\.map$/]);
registerControllerToRouter(app, {
    isShowUrls: true,
    kebabCase: false,
});

app.use(function (err, req, res, next) {
    logger.error(err);
    if (!err.code && !err.msg) {
        err = new CustomerError(502, '服务器内部错误,请稍后重试!技术支持:suppport@jingli365.com')
    } 

    res.writeHeader(err.code);
    res.write(JSON.stringify(reply(err.code, err.msg)));
    res.end();
});

export default app;
