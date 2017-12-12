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
});

// //城市信息
// app.get("/city/:id", async (req, res, next) => {
//     try {
//
//     } catch (err) {
//         next(err);
//     }
// });
//
// //城市下一级
// app.get("/city/:id/children", async (req, res, next) => {
//     try {
//         let {id} = req.params;
//         let cities = await DB.models['City'].findAll({where: {"parentId": id}});
//         res.json(cities);
//     } catch (err) {
//         next(err);
//     }
// });
//
// //城市上一级
// app.get('/city/:id/parent', async (req, res, next) => {
//     try {
//         let {id} = req.params;
//         let {lang} = req.query;
//         if (!lang) {
//             lang = 'zh';
//         }
//         let city = await DB.models['City'].findById(id);
//         let parentCity = await DB.models['City'].findById(city.parentId);
//         if (parentCity) {
//             let ret = parentCity.toJSON();
//             let alternateNames = await DB.models['CityAltName'].find({where: {cityId: city.parentId}});
//             let alternateName = await DB.models['CityAltName'].findOne({where: {cityId: city.parentId, lang: lang}});
//             if (alternateName) {
//                 ret.name = alternateName.value;
//             }
//             ret.alternateNames = alternateNames;
//             res.json(ret)
//         } else {
//             return res.json(null)
//         }
//     } catch (err) {
//         next(err)
//     }
// });
//
// //城市全部别名
// app.get('/city/:id/alternate', async (req, res, next) => {
//     try {
//         let {id} = req.params;
//         let alternateName = await DB.models['CityAltName'].findAll({where: {cityId: id}});
//         let alterName = [];
//         alternateName.map((alternateName) => {
//             alterName.push(alternateName.value)
//         });
//         res.json(alterName)
//     } catch (err) {
//         next(err)
//     }
// });
//
// //城市别名
// app.get('/city/:id/alternate/:lang', async (req, res, next) => {
//     try {
//         let {id} = req.params;
//         let {lang} = req.params;
//         let alternateName = await DB.models['CityAltName'].findOne({where: {cityId: id, lang: lang}});
//         res.json(alternateName);
//     } catch (err) {
//         next(err)
//     }
// })

export default app;
