/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

//导入express模块
import express = require("express");
const app = express();
import {DB} from '@jingli/database';
import _ = require("lodash")

//城市信息
app.get("/city/:id", async (req, res, next) => {
    try {
        let {id} = req.params;
        let {lang} = req.query;
        if (!lang) {
            lang = 'zh';
        }
        let city = await DB.models['City'].findById(id);
        if (!city) {
            return res.json(null);
        }
        let ret = city.toJSON();
        let alternateNames = await DB.models['CityAltName'].findAll({where: {cityId: id}});
        let alternateName = await DB.models['CityAltName'].findOne({where: {cityId: id, lang: lang}});
        if (alternateName) {
            ret.name = alternateName.value;
        }
        ret.alternateNames = alternateNames;
        res.json(ret);
    } catch (err) {
        next(err);
    }
});

//城市下一级
app.get("/city/:id/children", async (req, res, next) => {
    try {
        let {id} = req.params;
        let cities = await DB.models['City'].findAll({where: {"parentId": id}});
        res.json(cities);
    } catch (err) {
        next(err);
    }
});

//城市上一级
app.get('/city/:id/parent', async (req, res, next) => {
    try {
        let {id} = req.params;
        let {lang} = req.query;
        if (!lang) {
            lang = 'zh';
        }
        let city = await DB.models['City'].findById(id);
        let parentCity = await DB.models['City'].findById(city.parentId);
        if (parentCity) {
            let ret = parentCity.toJSON();
            let alternateNames = await DB.models['CityAltName'].find({where: {cityId: city.parentId}});
            let alternateName = await DB.models['CityAltName'].findOne({where: {cityId: city.parentId, lang: lang}});
            if (alternateName) {
                ret.name = alternateName.value;
            }
            ret.alternateNames = alternateNames;
            res.json(ret)
        } else {
            return res.json(null)
        }
    } catch (err) {
        next(err)
    }
});

//城市全部别名
app.get('/city/:id/alternate', async (req, res, next) => {
    try {
        let {id} = req.params;
        let alternateName = await DB.models['CityAltName'].findAll({where: {cityId: id}});
        let alterName = [];
        alternateName.map((alternateName) => {
            alterName.push(alternateName.value)
        });
        res.json(alterName)
    } catch (err) {
        next(err)
    }
});

//城市别名
app.get('/city/:id/alternate/:lang', async (req, res, next) => {
    try {
        let {id} = req.params;
        let {lang} = req.params;
        let alternateName = await DB.models['CityAltName'].findOne({where: {cityId: id, lang: lang}});
        res.json(alternateName);
    } catch (err) {
        next(err)
    }
})

app.get('/test', (req, res, next) => {
    res.send('ok');
});

export default app;
