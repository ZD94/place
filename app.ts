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
import { init } from '@jingli/error';

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
    if (err.code && err.msg) {
        return res.json(reply(err.code, err.msg));
    }
    next(err);
});

export default app;
