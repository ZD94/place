/**
 * Created by wlh on 2017/7/18.
 */


'use strict';
import path = require("path");
import {serverInit, serverStart} from "@jingli/server";
import config = require("@jingli/config");

serverInit({
    name: config.appName,
    entryPath: path.join(__dirname, './server'),
    // workerNumbers: 0,
})

function checkPort() {
    let port = config.listen
    console.log(port)
    if (typeof  port == 'string' && !/^\d+$/.test(port)) {
        console.log("PORT===>", port)
        if (fs.existsSync(port)) {
            fs.unlinkSync(port);
        }
    }
}

serverStart(checkPort);