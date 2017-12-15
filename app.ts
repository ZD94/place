/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

import path = require("path");
import express = require("express");
const app = express();
import { registerControllerToRouter, scannerDecoration } from '@jingli/restful';
const bodyParser = require('body-parser')

// import {DB} from '@jingli/database';
// import _ = require("lodash")
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

scannerDecoration(path.join(__dirname, 'controller'));
registerControllerToRouter(app, {
    isShowUrls: true,
    kebabCase: false,
});

export default app;
