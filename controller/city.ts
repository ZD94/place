/**
 * Created by wlh on 2017/8/30.
 */

'use strict';
import { Router, Restful, AbstractController} from '@jingli/restful';
import {DB} from "@jingli/database";
import sequelize = require("sequelize");

@Restful()
export class City extends AbstractController {

    $isValidId(id: string) {
        return /^\d+$/.test(id);
    }

    async get(req, res, next) {
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
        res.json(this.reply(0, ret));
    }

    @Router('/search')
    async keyword(req, res, next) {
        let {p, pz, lang, keyword} = req.query;
        if (!/^\d+$/.test(pz) || pz > 50) {
            pz = 50;
        }
        if (p < 1 || !/^\d+$/.test(p)) {
            p = 1;
        }
        let alternates = await DB.models['CityAltName'].findAll({ where: {value: keyword}});
        let cityIds = alternates.map( (alternate) => {
            return alternate.cityId;
        })
        let cities = await DB.models['City'].findAll({
            where: {
                $or: [{name: keyword}, {id: {$in: cityIds}}]
            },
            limit: pz,
            offset: (p-1) * pz,
        });
        res.json(this.reply(0, cities));
    }

    @Router('/nearby/:location')
    async nearBy(req, res, next) {
        let {location} = req.params;
        //ST_Distance('LINESTRING(-122.33 47.606, 0.0 51.5)'::geography, 'POINT(-21.96 64.15)':: geography);
        let point = location.split(/,/)
        let fn = <any>sequelize.fn('ST_Distance', sequelize.col('location'), `POINT(${point[0]} ${point[1]}):: geography`);
        let orderItem = [fn, 'asc'];
        let cities = await DB.models['City'].findAll({
            attributes: {include: [[ fn, 'distance' ]]},
            limit: 10,
            order: [orderItem],
        })
        res.send(this.reply(0, cities));
    }

    @Router('/:id/children')
    async children(req, res, next) {
        let {id} = req.params;
        let cities = await DB.models['City'].findAll({where: {"parentId": id}});
        res.json(this.reply(0, cities));
    }

    @Router('/:id/parent')
    async parent(req, res, next) {
        let {id} = req.params;
        let {lang} = req.query;
        if (!lang) {
            lang = 'zh';
        }
        let city = await DB.models['City'].findById(id);
        if (!city) {
            return res.json(this.reply(404, null));
        }
        let parentCity = await DB.models['City'].findById(city.parentId);
        if (!parentCity) {
            return res.json(this.reply(404, null));
        }

        let ret = parentCity.toJSON();
        let alternateNames = await DB.models['CityAltName'].find({where: {cityId: city.parentId}});
        let alternateName = await DB.models['CityAltName'].findOne({where: {cityId: city.parentId, lang: lang}});
        if (alternateName) {
            ret.name = alternateName.value;
        }
        ret.alternateNames = alternateNames;
        return res.json(this.reply(0, ret));
    }

    @Router('/:id/alternate')
    async alternates(req, res, next) {
        let {id} = req.params;
        let alternateNames = await DB.models['CityAltName'].findAll({where: {cityId: id}});
        res.json(this.reply(0, alternateNames));
    }

    @Router('/:id/alternate/:lang')
    async alternate(req, res, next) {
        let {id, lang} = req.params;
        let alternateName = await DB.models['CityAltName'].findOne({where: {cityId: id, lang: lang}});
        res.json(this.reply(0, alternateName));
    }
}