/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

import express = require("express");
const app = express();

app.get('/test', (req, res, next) => {
    res.send('ok');
})

export default app;
