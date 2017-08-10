/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

//导入express模块
import express = require("express");
import {type} from "os";
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
        let ret = city.toJSON();
        let alternateNames = await DB.models['CityAltName'].find({where: {cityId: id}});
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
        let city = await DB.models['City'].findAll();
        let result = [];
        city.map((cities) => {
            if (cities.parentId == id) {
                result.push(cities)
            }
        });
        if (result.length > 0) {
            res.json(result)
        } else {
            res.send('该城市没有下一级')
        }
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
            let alternateNames = await DB.models['CityAltName'].find({where: {cityId: id}});
            let alternateName = await DB.models['CityAltName'].findOne({where: {cityId: id, lang: lang}});
            if (alternateName) {
                ret.name = alternateName.value;
            }
            ret.alternateNames = alternateNames;
            res.json(ret)
        } else {
            res.send('该城市没有上一级')
        }
    } catch (err) {
        next(err)
    }
});

//城市全部别名
app.get('/city/:id/altername', async (req, res, next) => {
    try {
        let {id} = req.params;
        let alternateName = await DB.models['CityAltName'].findAll({where: {cityId: id}});
        // let alterName =alternateName.value
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
app.get('/city/:id/altername/:lang', async (req, res, next) => {
    try {
        let {id} = req.params;
        let {lang} = req.params;
        let alternateName = await DB.models['CityAltName'].find({where: {cityId: id, lang: lang}});
        res.json(alternateName.value)
    } catch (err) {
        next(err)
    }
})

app.get('/test', (req, res, next) => {
    res.send('ok');
});

export default app;
