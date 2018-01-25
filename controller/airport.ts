import { AbstractController, Restful, Router } from "@jingli/restful";
import { DB } from '@jingli/database';
import doc from '@jingli/doc';
import { AirportVM } from "../vm/airport-vm";
import {getCity, getCityAlternateName, isMatchOldStyle} from "../service/city";
import {getNewCityId} from "../service/cache";

@Restful()
export default class AirportController extends AbstractController { 

    $isValidId(id: string) { 
        return /^[a-zA-Z]{3}$/.test(id);
    }

    async $before(req, res, next) {
        if (!req.query.lang) {
            req.query.lang = 'zh';
        }
        let {cityId} = req.params;
        if (cityId && isMatchOldStyle(cityId)) {
            cityId = await getNewCityId(cityId);
            req.params.cityId = cityId;
        }
        let cityId2 = req.query.cityId;
        if (cityId2 && isMatchOldStyle(cityId2)) {
            req.query.cityId = await getNewCityId(cityId2);
        }
        return next();
    }

    @doc("根据IATA获取机场信息 params: {id: number}")
    async get(req, res, next) { 
        let { id } = req.params;
        let { lang } = req.query;
        let alternateName;
        let codes = ['iata', 'ctripcode', 'iatacode'];
        for(let code of codes) {
            alternateName = await DB.models['CityAltName'].findOne({
                where: {
                    lang: code,
                    value: id,
                }
            });
            if (alternateName) {
                break;
            }
        }

        if (!alternateName) { 
            return res.json(this.reply(404, null));
        }
        let airport = await getCity(alternateName.cityId);
        airport = await this.useAlternateName(airport, lang);
        let airportVM = new AirportVM(id, airport);
        res.json(this.reply(0, airportVM.toJSON()));
    }

    @doc("根据城市检索机场信息 qs: {cityId: string}")
    @Router('/getAirportByCity')    
    async queryAirportByCity(req, res, next) { 
        let { cityId, lang } = req.query;
        let airports = await DB.models['City'].findAll({
            where: {
                parentId: cityId,
                fcode: 'AIRP'
            }
        });
        airports = await Promise.all(airports.map(async (airport) => {
            let langs = ['iata', 'ctripcode', 'iatacode'];
            let alternate;
            for(let _lang of langs) {
                alternate = await getCityAlternateName(airport.id, _lang);
                if (_lang)
                    break;
            }
            airport = await this.useAlternateName(airport, lang);
            airport = new AirportVM(alternate.value, airport);
            return airport;
        }))
        return res.json(this.reply(0, airports));
    }

    private async useAlternateName(city, lang) {
        if (!lang) {
            lang = 'zh';
        }
        let alternateName = await getCityAlternateName(city.id, lang);
        if (alternateName && alternateName.value) {
            city.name = alternateName.value;
        }
        return city;
    }
}