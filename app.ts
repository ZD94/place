/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

//导入express模块
import express = require("express");
import {type} from "os";
const app = express();

app.get('/test', (req, res, next) => {
    res.send('ok');
})

export default app;
