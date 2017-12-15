import { AbstractController, Restful, Router } from "@jingli/restful";
import { DB } from '@jingli/database';
import doc from '@jingli/doc';
import { AirportVM } from "../vm/airport-vm";

@Restful()
export default class AirportController extends AbstractController { 

    $isValidId(id: string) { 
        return /^[a-zA-Z]{3}$/.test(id);
    }

    @doc("根据IATA获取机场信息 params: {id: number}")
    async get(req, res, next) { 
        let { id } = req.params;
        let { lang } = req.query;
        let alternateName = await DB.models['CityAltName'].findOne({
            where: {
                lang: 'iata',
                value: id,
            }
        });
        if (!alternateName) { 
            return res.json(this.reply(404, null));
        }
        let airport = await DB.models['City'].findById(alternateName.cityId);
        airport = await this.useAlternateName(airport, lang);
        let airportVM = new AirportVM(id, airport);
        res.json(this.reply(0, airportVM.toJSON()));
    }

    @doc("根据城市检索机场信息 qs: {cityId: string}")
    @Router('/getAirportByCity')    
    async queryAirportByCity(req, res, next) { 
        let { cityId, lang } = req.query;
        let city = await DB.models['City'].findById(cityId);
        let airports = await DB.models['City'].findAll({
            where: {
                parentId: cityId,
                fcode: 'AIRP'
            }
        });
        airports = await Promise.all(airports.map(async (airport) => { 
            //补充iata
            let alternate = await DB.models['CityAlternateName'].findOne({
                where: {
                    cityId: airport.id,
                    lang: 'iata',
                }
            });
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
        let alternateName = await DB.models['CityAlternateName'].findOne({ where: { cityId: city.id, lang: lang } });
        if (alternateName && alternateName.value) {
            city.name = alternateName.value;
        }
        return city;
    }
}