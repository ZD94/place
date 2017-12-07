/**
 * Created by wlh on 2017/8/30.
 */


'use strict';
import { Router, Restful, AbstractController } from '@jingli/restful';
import { DB } from "@jingli/database";
import sequelize = require("sequelize");
import City = require("../model/City");
import { CityVM, CityWithDistance } from "../vm/city-vm";
import AlternameVm from "../vm/altername-vm";
import { Request, Response, NextFunction } from 'express-serve-static-core';

let cityCols = [
    "id",
    "name",
    "letter",
    "timezone",
    "lng",
    "lat",
    "location",
    "parentId",
    "pinyin",
    // "type",
    // "cityLevel",
];

interface ICity {
    id: string,
    name: string,
    letter: string,
    timezone: string,
    lng: number,
    lat: number,
    location: object,
    parentId: string,
    pinyin: string,
    fcode: string,
    country_code: string
}

interface ICityAlternate {
    id: number,
    cityId: string,
    lang: string,
    value: string
}

@Restful()
export class CityController extends AbstractController {

    $isValidId(id: string) {
        return /^\d+$/.test(id) || /^CT_\d+$/.test(id) || /^CTW_\d+$/.test(id);
    }

    $before(req, res, next) {
        if (!req.query.lang) {
            req.query.lang = 'zh';
        }
        return next();
    }

    async get(req, res, next) {
        let { id } = req.params;
        let { lang, cityCode } = req.query;
        if (!lang) {
            lang = 'zh';
        }
        let city = await DB.models['City'].findById(id);

        //兼容之前city接口
        if (!city) {
            let options = {
                where: {
                    value: id,
                    lang: "jlcityid"
                }
            }
            let commonCity = await DB.models['CityAltName'].findOne(options);
            if (commonCity) {
                city = await DB.models['City'].findById(commonCity.cityId);
            }
        }

        if (!city) {
            return res.json(this.reply(404, null));
        }

        city = await this.useAlternateName(city, lang);
        let cityVm = new CityVM(city);
        res.json(this.reply(0, cityVm));
    }

    @Router('/getCitiesByLetter', 'GET')
    async getCityByLetter(req, res, next) {
        const { letter = 'A', limit = 20, page = 0, isAbroad = false } = req.query
        const cities = await DB.query(`select * from city.cities_cn where "isAbroad" = ${isAbroad} and 
            substring(letter,1,1) = '${letter}' offset ${page * limit} limit ${limit}`)
        const result = cities[0].map(c => new CityVM(c))
        res.json(this.reply(0, result))
    }

    @Router('/getCityByName', 'GET')
    async getCityByName(req, res, next) {
        const { name } = req.query
        if (!name) {
            throw { code: -1, msg: "城市名称为空" };
        }
        let result = await DB.models['City']
            .findOne({
                where: { name }
            })
        return res.json(this.reply(0, new CityVM(result)))
    }

    async find(req, res, next) {
        let { p, pz, order, where, lang } = req.query;
        p = p || 1;
        pz = pz || 20;
        let params = req.query;
        let query = {
            where: where || {},
            limit: pz,
            offset: pz * (p - 1),
            order: order
        };
        for (let key in params) {
            if (cityCols.indexOf(key) >= 0) {
                query.where[key] = params[key];
            }
        }

        if (!order || typeof order == undefined)
            query["order"] = [["created_at", "desc"]];
        let cities = await DB.models['City'].findAll(query);
        cities = await Promise.all(cities.map(async (city) => {
            city = await this.useAlternateName(city, lang);
            return new CityVM(city);
        }))
        res.json(this.reply(0, cities));
    }

    @Router('/search')
    async keyword(req, res, next) {
        let { p, pz, lang, keyword } = req.query;
        if (!/^\d+$/.test(pz) || pz > 50) {
            pz = 50;
        }
        if (p < 1 || !/^\d+$/.test(p)) {
            p = 1;
        }
        let alternates = await DB.models['CityAltName'].findAll({ where: { value: keyword } });
        let cityIds: number[] = alternates.map((alternate) => {
            return alternate.cityId;
        })
        let cities = await DB.models['City'].findAll({
            where: {
                $or: [{ name: keyword }, { id: { $in: cityIds } }]
            },
            limit: pz,
            offset: (p - 1) * pz,
        });
        cities = await Promise.all(cities.map(async (city) => {
            city = await this.useAlternateName(city, lang);
            return new CityVM(city);
        }));
        res.json(this.reply(0, cities));
    }

    @Router('/nearby/:location')
    async nearBy(req, res, next) {
        let { location } = req.params;
        let { distance, lang } = req.query;
        if (!distance || typeof distance == 'undefined' || !/^\d+$/.test(distance)) {
            distance = 10;
        }

        let point = location.split(/,/)
        let fnStr = `city."getBoundsFromLatLng"(${point[1]}, ${point[0]}, ${distance})`;
        let sql = `SELECT ST_XMin(${fnStr}) as lat_min, ST_XMax(${fnStr}) as lat_max, ST_YMin(${fnStr}) as lng_min, ST_YMax(${fnStr}) as lng_max`;
        let result = await DB.query(sql);
        result = result[0][0];

        //ST_Distance('LINESTRING(-122.33 47.606, 0.0 51.5)'::geography, 'POINT(-21.96 64.15)':: geography);
        let fn = <any>sequelize.fn('ST_Distance', sequelize.col('location'), `POINT(${point[0]} ${point[1]}):: geography`);
        let orderItem = [fn, 'asc'];
        let cities = await DB.models['City'].findAll({
            attributes: { include: [[fn, 'distance']] },
            where: {
                lat: {
                    $gte: result["lat_min"],
                    $lte: result["lat_max"]
                },
                lng: {
                    $gte: result["lng_min"],
                    $lte: result["lng_max"]
                }
            },
            limit: 10,
            order: [orderItem],
        });
        cities = await Promise.all(cities.map(async (city) => {
            city = await this.useAlternateName(city, lang);
            return new CityWithDistance(city);
        }));
        res.send(this.reply(0, cities));
    }

    @Router('/:id/children')
    async children(req, res, next) {
        let { id, lang } = req.params;
        let cities = await DB.models['City'].findAll({ where: { "parentId": id } });
        cities = await Promise.all(cities.map(async (city) => {
            city = await this.useAlternateName(city, lang);
            return new CityVM(city);
        }))
        res.json(this.reply(0, cities));
    }

    @Router('/:id/parent')
    async parent(req, res, next) {
        let { id } = req.params;
        let { lang } = req.query;
        if (!lang) {
            lang = 'zh';
        }
        let city = await DB.models['City'].findById(id);
        if (!city || !city.parentId) {
            return res.json(this.reply(404, null));
        }
        req.params.id = city.parentId;
        return this.get.bind(this)(req, res, next);
    }

    @Router('/:id/alternate')
    async alternates(req, res, next) {
        let { id } = req.params;
        let alternateNames = await DB.models['CityAltName'].findAll({ where: { cityId: id } });
        alternateNames = alternateNames.map((alternateName) => {
            return new AlternameVm(alternateName);
        })
        res.json(this.reply(0, alternateNames));
    }

    @Router('/:id/alternate/:lang')
    async alternate(req, res, next) {
        let { id, lang } = req.params;
        let alternateName = await DB.models['CityAltName'].findOne({ where: { cityId: id, lang: lang } });
        alternateName = new AlternameVm(alternateName);
        res.json(this.reply(0, alternateName));
    }

    async useAlternateName(city, lang) {
        if (!lang) {
            lang = 'zh';
        }
        let alternateName = await DB.models['CityAlternateName'].findOne({ where: { cityId: city.id, lang: lang } });
        if (alternateName && alternateName.value) {
            city.name = alternateName.value;
        }
        return city;
    }

    @Router('/getAirportOrStation')
    async getPlaceByCode(req: Request, res: Response, next: NextFunction) {
        const reg = /^[a-zA-Z]{3}/
        const { type, code }: { type: string, code: string } = req.query
        const valid: boolean = reg.test(type) && reg.test(code)
        if (!valid) return res.json(this.reply(400, null))

        const alternate: ICityAlternate = await DB.models['CityAltName'].findOne({
            where: { lang: type.toUpperCase(), value: code.toUpperCase() }
        })
        if (!alternate) return res.json(this.reply(404, null))

        const city: ICity = await DB.models['City'].findById(alternate.cityId)
        return res.json(this.reply(0, new CityVM(city)))
    }
}