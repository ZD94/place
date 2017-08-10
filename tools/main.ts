/**
 * Created by Administrator on 2017/8/10.
 */

import './test';

import config = require("@jingli/config");

import Logger from "@jingli/logger";
Logger.init({});

import database = require("@jingli/database");
database.init(config.postgres.url);
import "../model";
database.DB.sync({force: false})
.catch( (err) => {
    throw err;
})

import './test';