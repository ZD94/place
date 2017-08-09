/**
 * Created by wlh on 2017/7/18.
 */

'use strict';

//导入express模块
import express = require("express");
import {type} from "os";
const app = express();
import {DB} from '@jingli/database';


app.get("/city/:id", async (req, res, next) => {
    try {
        let {id} = req.params;
        let {lang} = req.query;
        if (!lang) {
            lang = 'zh';
        }
        let city = await DB.models['City'].findById(id);
        let alternateName = await DB.models['CityAlterName'].findOne({where: {cityId: id, lang: lang}});
        if (alternateName) {
            city.name = alternateName.value;
        }
        res.json(city);
    } catch(err) {
        next(err);
    }
});

app.get('/test', (req, res, next) => {
    res.send('ok');
})

export default app;
