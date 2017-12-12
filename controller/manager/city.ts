import { AbstractController, Restful, Router } from "@jingli/restful";
import { DB } from '@jingli/database';
import doc from '@jingli/doc';

@Restful('/manager/city')
export default class ManagerCityController extends AbstractController {

    $isValidId(id: string) {
        return /^\d+$/.test(id);
    }

    @doc('获取城市详情')
    async get(req, res, next) {
        let { id } = req.params;
        let { lang } = req.query;
        let cityModel = await DB.models['City'].findById(id);
        cityModel = await this.translate(cityModel, lang);
        return res.json(this.reply(0, cityModel));
    }

    @doc('添加城市')
    async add(req, res, next) {
        let { id, name, letter, pinyin, lat, lng, fcode, country_code, parentId } = req.body;
        let errorMsg = [];
        ["id", "name", "letter", "pinyin", "lat", "lng", "fcode", "parentId", "country_code"].forEach((key) => {
            if (!req.body[key]) {
                errorMsg.push(key);
            }
        })
        if (errorMsg.length) {
            return res.json(this.reply(500, errorMsg.join(",") + '格式不正确'));
        }
        let sql = `INSERT INTO city.cities_${country_code} (id, name, letter, pinyin, lat, lng, location, fcode, country_code, "parentId", created_at, updated_at) 
                    VALUES(${id}, '${name}', '${letter}', '${pinyin}', '${lat}', '${lng}', ST_SetSRID(ST_MakePoint(${lng}, ${lat}),4326), '${fcode}', '${country_code}', '${parentId}', now(), now());
        `;
        await DB.query(sql);
        let cityModel = await DB.models['City'].findById(id);
        cityModel = await this.translate(cityModel);
        return res.json(this.reply(0, cityModel));
    }

    @doc("更新城市")
    async update(req, res, next) {
        let { id } = req.params
        let { name, letter, pinyin, lat, lng, fcode, country_code } = req.body;
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

    @doc("获取下级城市")
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

    @doc("获取城市别名")
    @Router('/:id/alter-name')
    async alterNames(req, res, next) {
        let { id } = req.params;
        let alterNames = await DB.models['CityAlternateName'].findAll({ where: { cityId: id } });
        return res.json(this.reply(0, alterNames));
    }

    @doc("根据关键字搜索城市")
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

    @doc("新增别名")
    @Router('/alternate', 'POST')
    async addAlternateName(req, res, next) {
        const { cityId, lang, value } = req.body
        if (!cityId || !lang || !value) {
            return res.sendStatus(400)
        }
        let entity = DB.models['CityAlternateName'].build(req.body)
        entity = await entity.save()
        return res.json(this.reply(0, entity))
    }

    @doc("更新别名")
    @Router('/alternate/:id', 'PUT')
    async updateAlternate(req, res, next) {
        let alternate = await DB.models['CityAlternateName'].findById(req.params.id)
        for (let k in req.body) {
            alternate[k] = req.body[k]
        }
        alternate = await alternate.save()
        return res.json(this.reply(0, alternate))
    }

    @doc("删除别名")
    @Router('/alternate/:id', 'DELETE')
    async delAlternate(req, res, next) {
        const alternate = await DB.models['CityAlternateName'].findById(req.params.id)
        await alternate.destroy()
        return res.json(this.reply(0, null))
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