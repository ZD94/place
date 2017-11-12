/**
 * Created by wlh on 2017/8/30.
 */


'use strict';
import {Router, Restful, AbstractController} from '@jingli/restful';
import {DB} from "@jingli/database";
import sequelize = require("sequelize");
import City = require("../model/City");
import {CityVM} from "../vm/city-vm";
import AlternameVm from "../vm/altername-vm";

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

@Restful()
export class CityController extends AbstractController {

    $isValidId(id: string) {
        return /^\d+$/.test(id) || /^CT_\d+$/.test(id) || /^CTW_\d+$/.test(id);
    }

    async get(req, res, next) {
        let {id} = req.params;
        let {lang, cityCode} = req.query;
        if (!lang) {
            lang = 'zh';
        }
        let city = await DB.models['City'].findById(id);

        //兼容之前city接口
        if (!city && cityCode) {
            let options = {
                where: {
                    value: cityCode,
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

        let alternateName = await DB.models['CityAltName'].findOne({where: {cityId: id, lang: lang}});
        if (alternateName) {
            city.name = alternateName.value;
        }
        let cityVm = new CityVM(city);
        res.json(this.reply(0, cityVm));
    }

    async find(req, res, next) {
        let {p, pz, order, where} = req.query;
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
        cities = cities.map( (city) => {
            return new CityVM(city);
        })
        res.json(this.reply(0, cities));
    }

    // @Router('/getAll')
    // async findAll(req, res, next) {
    //     console.info("findAllCities============");
    //     let { type, isAbroad} = req.query;
    //     let where: any = {};
    //     if(type){
    //         where.type = type;
    //     }
    //     if (isAbroad !== null && isAbroad !== undefined) {
    //         where.isAbroad = Boolean(isAbroad);
    //     }else{
    //         where.isAbroad = false;
    //     }
    //     let all_cities = await DB.models['City'].findAll({
    //         where: where,
    //         order: [["cityLevel", "desc"],["letter", "asc"]]});
    //     all_cities = transform(all_cities);
    //     res.json(this.reply(0, all_cities));
    // }

    // @Router('/groupByLetter')
    // async queryCitiesGroupByLetter(req, res, next) {
    //     let result;
    //     let {isAbroad} = req.query;
    //     let where = `where type = 2 `
    //     let where2 = `where substring(letter, 1, 1) = ? and type = 2 `
    //
    //     if (isAbroad !== null && isAbroad !== undefined) {
    //         isAbroad = Boolean(isAbroad);
    //     } else {
    //         isAbroad = false;
    //     }
    //     where += ` AND "isAbroad"= ${isAbroad} `;
    //     where2 += ` AND "isAbroad" = ${isAbroad}`;
    //     var sql = ` select substring(letter, 1, 1) as first_letter,count(1)
    //                 from public.cities
    //                 ${where}
    //                 group by substring(letter, 1, 1)
    //                 order by substring(letter, 1, 1)`;
    //
    //     let rows = await DB.query(sql);
    //     if (rows && rows[0]) {
    //         var letters = rows[0].map(async function (row) {
    //             //查找城市信息
    //             var sql2 = `select id, name, "isAbroad", pinyin, letter, lat, lng, type, "cityLevel", "parentId" , location
    //         from public.cities ${where2}`;
    //             let cities = await DB.query(sql2, {replacements: [row.first_letter]});
    //             row.first_letter = row.first_letter || '#';
    //             row.cities = cities;
    //             return row;
    //         })
    //         result = await Promise.all(letters);
    //     }
    //
    //     res.json(this.reply(0, result));
    // }

    // @Router('/getByLetter')
    // async getCitiesByLetter(req, res, next) {
    //     let {isAbroad = false, letter = 'A', limit = 20, page = 0, type} = req.query;
    //     let offset = page * limit;
    //
    //     let typestring = 2;
    //     if (typeof(type) == 'string') {
    //         type = JSON.parse(type);
    //         typestring = type.join(",");
    //     }
    //
    //     let sql = `select id, name, "isAbroad", pinyin, letter, lat, lng, type, "cityLevel", "parentId" , location
    //     from public.cities where "isAbroad" is ${isAbroad} and substring(letter,1,1) = '${letter}' and type in (${typestring}) limit ${limit} offset ${offset}`;
    //     let sql2 = `select count(*) from public.cities where "isAbroad" is ${isAbroad} and substring(letter,1,1) = '${letter}' and type in (${typestring})`;
    //     let count = await DB.query(sql2).spread((result) => {
    //         return result;
    //     })
    //     let returnResult = await DB.query(sql).spread((result) => {
    //         return {
    //             total: Number(count[0].count),
    //             cities: result
    //         };
    //     });
    //     res.json(this.reply(0, returnResult));
    // }

    @Router('/search')
    async keyword(req, res, next) {
        let {p, pz, lang, keyword} = req.query;
        if (!/^\d+$/.test(pz) || pz > 50) {
            pz = 50;
        }
        if (p < 1 || !/^\d+$/.test(p)) {
            p = 1;
        }
        let alternates = await DB.models['CityAltName'].findAll({where: {value: keyword}});
        let cityIds = alternates.map((alternate) => {
            return alternate.cityId;
        })
        let cities = await DB.models['City'].findAll({
            where: {
                $or: [{name: keyword}, {id: {$in: cityIds}}]
            },
            limit: pz,
            offset: (p - 1) * pz,
        });
        cities = cities.map( (city) => {
            return new CityVM(city);
        })
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
            attributes: {include: [[fn, 'distance']]},
            limit: 10,
            order: [orderItem],
        });
        cities = cities.map( (city) => {
            return new CityVM(city);
        })
        res.send(this.reply(0, cities));
    }

    @Router('/:id/children')
    async children(req, res, next) {
        let {id} = req.params;
        let cities = await DB.models['City'].findAll({where: {"parentId": id}});
        cities = cities.map( (city) => {
            return new CityVM(city);
        })
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
        if (!city || !city.parentId) {
            return res.json(this.reply(404, null));
        }
        req.params.id = city.parentId;
        return this.get.bind(this)(req, res, next);
    }

    @Router('/:id/alternate')
    async alternates(req, res, next) {
        let {id} = req.params;
        let alternateNames = await DB.models['CityAltName'].findAll({where: {cityId: id}});
        alternateNames = alternateNames.map( (alternateName) => {
            return new AlternameVm(alternateName);
        })
        res.json(this.reply(0, alternateNames));
    }

    @Router('/:id/alternate/:lang')
    async alternate(req, res, next) {
        let {id, lang} = req.params;
        let alternateName = await DB.models['CityAltName'].findOne({where: {cityId: id, lang: lang}});
        alternateName = new AlternameVm(alternateName);
        res.json(this.reply(0, alternateName));
    }
}