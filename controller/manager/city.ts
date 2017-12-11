import { AbstractController, Restful, Router } from "@jingli/restful";
import { DB } from '@jingli/database';

@Restful('/manager/city')
export default class ManagerCityController extends AbstractController { 

    $isValidId(id: string) { 
        return /^\d+$/.test(id);
    }

    async get(req, res, next) { 
        let { id } = req.params;
        let { lang } = req.query;
        let cityModel = await DB.models['City'].findById(id);
        cityModel = await this.translate(cityModel, lang);
        return res.json(this.reply(0, cityModel));
    }

    async add(req, res, next) { 
        let { id, name, letter, pinyin, lat, lng, fcode, country_code } = req.body;
        let errorMsg = [];
        ["id", "name", "letter", "pinyin", "lat", "lng", "fcode", "country_code"].forEach((key) => { 
            if (!req.body[key]) { 
                errorMsg.push(key);
            }
        })
        if (errorMsg.length) { 
            return res.json(this.reply(500, errorMsg.join(",") + '格式不正确'));
        }
        let sql = `INSERT INTO city.cities_${country_code} (id, name, letter, pinyin, lat, lng, location, fcode, country_code) 
                    VALUES(${id}, '${name}', '${letter}', '${pinyin}', '${lat}', '${lng}', ST_SetSRID(ST_MakePoint(${lng}, ${lat}),4326);, '${fcode}', '${country_code}');
        `;
        await DB.query(sql);
        let cityModel = await DB.models['City'].findById(id);
        cityModel = await this.translate(cityModel);
        return res.json(this.reply(0, cityModel));
    }

    async update(req, res, next) { 
        let { id, name, letter, pinyin, lat, lng, fcode, country_code } = req.body;
        let cityModel = await DB.models['City'].findById(id);
        ["name", "letter", "pinyin", "lat", "lng", "fcode", "country_code"].forEach((key) => { 
            if (req.body[key]) { 
                cityModel[key] = req.body[key];
            }
        })
        cityModel = await cityModel.save();
        cityModel = await this.translate(cityModel);
        return res.json(this.reply(0, cityModel));
    }

    @Router('/:id/children')
    async getRoot(req, res, next) { 
        let { id } = req.params;
        let { lang } = req.query;
        if (id == 0) { 
            id = null;
        }
        let cities = await DB.models['City'].findAll({ where: { parentId: id } });
        cities = await Promise.all(
            cities.map(async (city) => { 
                return this.translate(city, lang);
            })
        )
        return res.json(this.reply(0, cities));
    }

    @Router('/:id/alter-name')
    async alterNames(req, res, next) { 
        let { id } = req.params;
        let alterNames = await DB.models['CityAlternateName'].findAll({ where: { cityId: id } });
        return res.json(this.reply(0, alterNames));
    }

    @Router('/search/:keyword')
    async search(req, res, next) { 
        let { keyword } = req.params;
        let { lang } = req.query;
        let alterNames = await DB.models['CityAlternateName'].findAll({ where: { value: keyword } });
        let cityIds = alterNames.map((alterName) => {
            return alterName.cityId;
        });
        let cities = await DB.models['City'].findAll({
            where: {
                id: {
                    $in: cityIds,
                }
            }
        })
        cities = await Promise.all(cities.map(async (city) => { 
            return await this.translate(city);
        }))
        return res.json(this.reply(0, cities));
    }

    private async translate(city: any, lang?: string): Promise<any> { 
        if (!lang) { 
            lang = 'zh';
        }
        let { id } = city;
        let alterName = await DB.models['CityAlternateName'].findOne({ where: { cityId: id, lang: lang } });
        if (alterName) { 
            city.name = alterName.value;
        }
        return city;
    }
}