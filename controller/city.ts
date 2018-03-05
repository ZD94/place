/**
 * Created by wlh on 2017/8/30.
 */



'use strict';
import { Router, Restful, AbstractController } from '@jingli/restful';
import { DB } from "@jingli/database";
import sequelize = require("sequelize");
import City = require("../model/City");
import { CityVM, CityVmSimple, CityWithDistance } from "../vm/city-vm";
import AlternameVm from "../vm/altername-vm";
import { Request, Response, NextFunction } from 'express-serve-static-core';
import doc from '@jingli/doc';
import { ParamsNotValidError, NotFoundError, CustomerError } from '@jingli/error';
import { getCity, isMatchOldStyle, isMatchNewStyle, getCityAlternateName } from '../service/city';
import { getNewCityId } from "../service/cache";
import { toBoolean } from '../service/helper';

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
];

export const EPlace = {
    GLOBALE: '1'
}

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

    async $before(req, res, next) {
        if (!req.query.lang) {
            req.query.lang = 'zh';
        }
        let { id } = req.params;
        if (id && isMatchOldStyle(id)) {
            id = await getNewCityId(id);
            req.params.id = id;
        }
        return next();
    }

    @doc("获取城市详情")
    async get(req, res, next) {
        let { id } = req.params;
        let { lang } = req.query;
        if (!lang) {
            lang = 'zh';
        }
        if (id === 0 || id === '0') {
            id = EPlace.GLOBALE;
        }
        if (!id) {
            throw new ParamsNotValidError('id');
        }

        let city = await getCity(id)
        if (!city) {
            throw new NotFoundError('city');
        }
        city = await this.useAlternateName(city, lang);
        let cityVm = new CityVM(city);
        res.json(this.reply(0, cityVm));
    }

    @doc("大城市")
    @Router('/hotcities')
    async getHotCities(req, res, next) {
        let { country_code, isAbroad, lang = 'zh' } = req.query;
        let ids;
        isAbroad = toBoolean(isAbroad);
        if (!isAbroad) {
            ids = ['CT_131', //北京
                'CT_289', //上海
                'CT_340', //深圳
                'CT_257', //广州
                'CT_332', //天津
                'CT_075', //成都
                'CT_179', //杭州
                'CT_167', //大连
                'CT_218', //武汉
                'CT_132', //重庆
                'CT_52408', //台北
                'CT_2911', //澳门
                'CT_2912', //香港
            ]
        } else {
            ids = [
                'CTW_332', //吉隆坡
                'CTW_309', //新加坡
                'CTW_329', //曼谷
                'CTW_310', //悉尼
                'CTW_303', //法兰克福
                'CTW_308', //巴黎
                'CTW_352', //马尼拉
                'CTW_332', //吉隆坡
            ]
        }
        let ps = ids.map(async (id: string) => {
            return getCity(id);
        })
        let cities = await Promise.all<any>(ps);
        cities = cities.filter((city) => {
            return !!city;
        })
        ps = cities.map(async (city) => {
            city = await this.useAlternateName(city, lang);
            city = new CityVM(city);
            return city;
        })
        cities = await Promise.all<CityVM>(ps);
        res.json(this.reply(0, cities));
    }

    @doc('根据首字母获取城市')
    @Router('/getCitiesByLetter')
    async getCityByLetter(req, res, next) {
        const countryCodeReg = /^\w{2}$/;
        const otherCountryCodeReg = /^!\w{2}$/;

        let { letter = 'A', lang = 'zh', country_code, isAbroad = false, page = 1, limit = 50 } = req.query;
        isAbroad = toBoolean(isAbroad);
        if (!page || !/^\d+$/.test(page.toString())) {
            page = 1;
        }
        if (!limit || !/^\d+$/.test(limit.toString())) {
            limit = 50;
        }
        if (page < 1) {
            page = 1;
        }
        if (limit < 1) {
            limit = 50;
        }
        letter = letter.toUpperCase();
        if (country_code && !countryCodeReg.test(country_code) && !otherCountryCodeReg.test(country_code)) {
            throw new ParamsNotValidError('country_code');
        }

        if (!country_code && isAbroad == true) {
            country_code = '!CN';
        }

        if (!country_code) {
            country_code = 'CN';
        }

        country_code = country_code.toUpperCase();
        let sql = '';
        if (countryCodeReg.test(country_code)) {
            sql = `
                SELECT id, name, substring(letter,1,1) as first_letter, country_code, lng, lat
                FROM city.cities_${country_code.toLowerCase()}
                WHERE "isCity"=true AND country_code = '${country_code}' AND substring(letter,1,1) = '${letter}'
            `
        }

        if (otherCountryCodeReg.test(country_code)) {
            sql = `
                SELECT id, name, substring(letter,1,1) as first_letter , country_code, lng, lat
                FROM cities
                WHERE country_code != '${country_code}' AND "isCity"=true AND substring(letter,1,1) = '${letter}'
            `
        }
        let pageSQL = ` OFFSET ${(page - 1) * limit} LIMIT ${limit} `;
        sql = sql + pageSQL;

        let result = await DB.query(sql);
        let cities = result[0];
        cities = await Promise.all(cities.map((city) => {
            return this.useAlternateName(city, lang)
        }));
        cities = cities.map((city) => {
            return new CityVM(city);
        })
        res.json(this.reply(0, cities));
    }

    @doc('根据名字获取城市')
    @Router('/getCityByName', 'GET')
    async getCityByName(req, res, next) {
        const { name } = req.query
        if (!name) {
            throw new CustomerError(502, '城市名称不能为空');
        }

        let city = await DB.models['City']
            .findOne({
                where: {
                    name,
                    isCity: true,
                }
            });
        if (!city) {
            throw new NotFoundError('city');
        }
        return res.json(this.reply(0, new CityVM(city)))
    }

    @doc("获取城市列表")
    async find(req, res, next) {
        let { p, pz, order, lang, isAbroad, countryCode } = req.query;
        isAbroad = toBoolean(isAbroad);
        p = p || 1;
        if (!/^\d+$/.test(p) || p < 1) {
            p = 1;
        }
        pz = pz || 20;
        if (!/^\d+$/.test(pz) || pz < 1) {
            pz = 20;
        }
        if (!countryCode && !isAbroad) {
            countryCode = 'CN';
        }
        let where: any = { isCity: true };
        if (countryCode) {
            where.country_code = countryCode;
        }
        if (!countryCode && isAbroad) {
            where.country_code = {
                '$ne': 'CN',
            };
        }
        let offset = (p - 1) * pz;
        let bigCities = await DB.models['City'].findAll({ where: where, offset: offset, limit: pz, order: order });
        bigCities = await Promise.all(bigCities.map(async (place) => {
            place = await this.useAlternateName(place, lang);
            place = new CityVM(place);
            return place;
        }));
        res.json(this.reply(0, bigCities));
    }

    @doc("获取城市列表-接收where条件")
    @Router('/byWhere', 'GET')
    async findWhere(req, res, next) {
        let { where = {}, pz = 20, p = 1, order, isAbroad, countryCode, lang } = req.query;
        isAbroad = toBoolean(isAbroad);
        if (!/^\d+$/.test(p) || p < 1) {
            p = 1;
        }
        if (!/^\d+$/.test(pz) || pz < 1) {
            pz = 20;
        }
        if (!countryCode && !isAbroad) {
            countryCode = 'CN';
        }

        if (countryCode) {
            where.country_code = countryCode;
        }
        if (!countryCode && isAbroad) {
            where.country_code = {
                '$ne': 'CN',
            };
        }
        let offset = (p - 1) * pz;
        let bigCities = await DB.models['City'].findAll({ where, offset, limit: pz, order: order });
        bigCities = await Promise.all(bigCities.map(async (place) => {
            place = await this.useAlternateName(place, lang);
            place = new CityVM(place);
            return place;
        }));
        res.json(this.reply(0, bigCities));
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
        if (!lang) {
            lang = 'zh'
        }
        if (keyword.length < 2) {
            return res.json(this.reply(0, []));
        }
        let langs = [];
        let where: any = {};
        if (/[\u4e00-\u9fa5]/g.test(keyword)) {
            where = {
                lang: 'zh',
            }
        }
        where.value = {
            $ilike: `${keyword}%`,
        }

        let alternates = await DB.models['CityAltName'].findAll({
            where,
        });
        let cityIds: number[] = alternates.map((alternate) => {
            return alternate.cityId;
        })
        let cities = await DB.models['City'].findAll({
            where: {
                $or: [{ id: { $in: cityIds } }],
                fcode: {
                    $ne: 'PPL'
                }
            },
            limit: pz,
            offset: (p - 1) * pz,
            order: [["isCity", "desc"]]
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
        if (isMatchOldStyle(id)) {
            let city = await getCity(id);
            if (!city) {
                throw new NotFoundError('city');
            }
            id = city.id;
        }
        if (!isMatchNewStyle(id)) {
            throw new ParamsNotValidError("id");
        }
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
        let city = await getCity(id);
        if (!city || !city.parentId) {
            throw new NotFoundError("city");
        }
        req.params.id = city.parentId;
        return this.get.bind(this)(req, res, next);
    }

    @doc("获取所有别名")
    @Router('/:id/alternate')
    async alternates(req, res, next) {
        let { id } = req.params;
        if (isMatchOldStyle(id)) {
            let city = await getCity(id);
            if (!city) {
                throw new NotFoundError('city');
            }
            id = city.id;
        }
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
        if (isMatchOldStyle(id)) {
            let city = await getCity(id);
            if (!city) {
                throw new NotFoundError('city');
            }
            id = city.id;
        }
        let alternateName = await getCityAlternateName(id, lang);
        alternateName = new AlternameVm(alternateName);
        res.json(this.reply(0, alternateName));
    }

    async useAlternateName(city, lang) {
        if (!lang) {
            lang = 'zh';
        }
        if (!city) {
            throw new ParamsNotValidError('city');
        }
        let alternateName = await getCityAlternateName(city.id, lang);
        if (alternateName && alternateName.value) {
            city.name = alternateName.value;
        }
        return city;
    }

    @doc("根据机场或车站字码获取详情")
    @Router('/getAirportOrStation')
    async getPlaceByCode(req: Request, res: Response, next: NextFunction) {
        const reg = /^[a-zA-Z]{3}$/
        const { type, code }: { type: string, code: string } = req.query
        const valid: boolean = reg.test(type) && reg.test(code)
        if (!valid) {
            throw new ParamsNotValidError(["code", "type"])
        }

        const alternate: ICityAlternate = await DB.models['CityAltName'].findOne({
            where: { lang: type.toUpperCase(), value: code.toUpperCase() }
        })
        if (!alternate) {
            throw new NotFoundError("AirportOrStation");
        }
        const city: ICity = await DB.models['City'].findById(alternate.cityId)
        if (!city) {
            throw new NotFoundError('city');
        }
        return res.json(this.reply(0, new CityVM(city)))
    }
}