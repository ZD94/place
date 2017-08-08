/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

import path = require("path");
import {DB} from "@jingli/database";
DB.models['City'] = DB.import(path.join(__dirname, './City'));
DB.models['CityAltName'] = DB.import(path.join(__dirname, './CityAltName'));
// DB.models['CityCode'] = DB.import(path.join(__dirname, './CityCode'));
// DB.models['CityGeoName'] = DB.import(path.join(__dirname, './CityGeoName'));
