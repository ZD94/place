/**
 * Created by wlh on 2017/8/30.
 */


'use strict';
import { Router, Restful, AbstractController } from '@jingli/restful';
import { DB } from "@jingli/database";
import sequelize = require("sequelize");
import City = require("../model/City");
import {CityVM, CityVmSimple, CityWithDistance} from "../vm/city-vm";
import AlternameVm from "../vm/altername-vm";
import { Request, Response, NextFunction } from 'express-serve-static-core';
import doc from '@jingli/doc';

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

    @doc("获取城市详情")
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

    @doc('根据首字母获取城市')
    @Router('/getCitiesByLetter')
    async getCityByLetter(req, res, next) {
        const { letter = 'A', lang = 'zh' } = req.query;
        let country_code = req.query.country_code;
        if (!country_code) { 
            country_code = 'CN'
        }
        let sql = '';
        if (country_code == 'CN') {
            sql = `
                SELECT id, name, substring(letter,1,1) as first_letter 
                FROM cities 
                WHERE country_code = '${country_code}' AND substring(letter,1,1) = '${letter}' AND (fcode = 'ADM2' OR fcode = 'PPLC' OR fcode = 'PPLA')
            `
        }

        if (country_code === '!CN') {
            sql = `
                SELECT id, name, substring(letter,1,1) as first_letter 
                FROM cities 
                WHERE country_code != '${country_code}' AND substring(letter,1,1) = '${letter}' AND (fcode = 'PPLC' OR fcode = 'PPLA'  OR fcode = 'PPLA2')
            `
        }

        if (country_code !== 'CN' && country_code !== '!CN') {
            sql = `
                SELECT id, name, substring(letter,1,1) as first_letter 
                FROM cities 
                WHERE country_code = '${country_code}' AND substring(letter,1,1) = '${letter}' AND (fcode = 'PPLC' OR fcode = 'PPLA'  OR fcode = 'PPLA2')
            `
        }

        let result = await DB.query(sql);
        let cities = result[0];

        cities = await Promise.all(cities.map( (city) => {
            return this.useAlternateName(city, lang)
        }));
        cities = cities.map( (city) => {
            return new CityVmSimple(city);
        })
        res.json(this.reply(0, cities));
    }

    @doc('根据名字获取城市')
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

    @doc("获取城市列表")
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

    @doc("根据关键字搜索城市")
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

    @doc("根据坐标查询附近城市")
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

    @doc("获取下级地区")
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

    @doc("获取上级地区")
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

    @doc("获取所有别名")
    @Router('/:id/alternate')
    async alternates(req, res, next) {
        let { id } = req.params;
        let alternateNames = await DB.models['CityAltName'].findAll({ where: { cityId: id } });
        alternateNames = alternateNames.map((alternateName) => {
            return new AlternameVm(alternateName);
        })
        res.json(this.reply(0, alternateNames));
    }

    @doc("获取特定语言别名")
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

    @doc("根据机场或车站字码获取详情")
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