/**
 * Created by wlh on 2017/7/18.
 */

'use strict';
import path = require("path");
import {DB} from "@jingli/database";
DB.models['Place'] = DB.import(path.join(__dirname, './place'));