/**
 * Created by Administrator on 2017/7/31.
 */

import request = require('request-promise');
global.Promise = require('bluebird');
// import fs = require('fs-extra-promise');
import pinyin = require('pinyin');
import {DB} from  '@jingli/database';
import Bluebird = require("bluebird");
import yargs = require("yargs");
import Logger from "@jingli/logger";
const logger = new Logger("geoname");

let KEY = [
    // 'wangpeng',
    // 'zelinlee0303', 'zhangdong', 'zd12321',
    // 'forevertimes', 'jack2017', 'mr.he', 'woshilzl', 'zd121',
    // 'wanglihui', 'wanglihui_sjz',
]

KEY = yargs.argv.keys || ['wangpeng', 'zelinlee0303', 'zhangdong', 'zd12321'];
if (typeof KEY == 'string') {
    KEY = (<string>KEY).split(/\s+/g);
}

let useNum = 0;
let keyIndex = 0;
function getKey() {
    ++useNum;
    if (useNum >= 500) {
        keyIndex = keyIndex+1;
        useNum = 0;
    }
    if (keyIndex >= KEY.length) {
        keyIndex = 0;
    }
    let key = KEY[keyIndex];
    console.info(`User key `, key);
    return key;
}

export interface ICity {
    geoid: string;
    name: string;
}

const REQ_TIMEOUT = 20 * 1000
//得到国家信息
async function getContries() {
    const URL = 'http://api.geonames.org/countryInfoJSON';
    let data = await request({
        uri: URL,
        json: true,
        qs: {
            username: getKey(),
            lang: 'zh'
        },
        timeout: REQ_TIMEOUT,
    })
    return data.geonames;
}

interface GeoChildren {
    adminCode1: string;
    lng: string;
    geonameId: number;
    toponymName: string;
    countryId: string;
    fcl: string;
    population: number;
    numberOfChildren: number;
    countryCode: string;
    name: string;
    fclName: string;
    countryName: string;
    fcodeName: string;
    adminName1: string;
    lat: string;
    fcode: string;
}
interface GeoPlaceTimezone {
    gmtOffset: number;
    dstOffset: number;
    timeZoneId: string;
}
interface GeoBbox {
    east: number;
    south: number;
    north: number;
    west: number;
    accuracyLevel: number;
}
interface AlternateNames {
    name: string;
    lang: string;
    isPreferredName?: boolean;
}
interface GeoPlace {
    timezone: GeoPlaceTimezone,
    bbox: GeoBbox,
    asciiName: string,
    countryId: string,
    fcl: string,
    srtm3: number,
    countryCode: string,
    adminId1: string,
    lat: string,
    fcode: string,
    continentCode: string,
    adminCode1: string,
    lng: string,
    geonameId: number,
    toponymName: string,
    adminTypeName: string,
    population: number,
    wikipediaURL: string,
    adminName5: string,
    adminName4: string,
    adminName3: string,
    alternateNames: AlternateNames [],
    adminName2: string,
    name: string,
    fclName: string,
    countryName: string,
    fcodeName: string,
    adminName1: string
}

async function getPlace(geoid: string): Promise<GeoPlace> {
    let times = 3;
    let result;
    while(times > 0) {
        try {
            result = await request<GeoPlace>({
                uri: 'http://api.geonames.org/getJSON',
                json: true,
                qs: {
                    geonameId: geoid,
                    username: getKey(),
                },
                lang: 'zh',
                timeout: REQ_TIMEOUT,
            });
            break;
        } catch(err) {
            logger.error(err);
            times = times - 1;
            if (times <= 0) {
                throw err;
            }
        }
    }
    return result;
}

async function forEachChild(geoid: string, callback: (place: GeoPlace, parentId: string) => Promise<any>) {
    let data;
    let times = 3;
    while(times > 0) {
        try {
            data = await request({
                uri: 'http://api.geonames.org/childrenJSON',
                json: true,
                qs: {
                    geonameId: geoid,
                    username: getKey(),
                },
                lang: 'zh',
                timeout: REQ_TIMEOUT,
            });
            break;
        } catch(err) {
            times = times - 1;
            logger.error(err);
            if (times <= 0) {
                throw err;
            }
        }
    }

    if (!data || !data.geonames) {
        logger.error(data)
        return;
    }
    for (let child of data.geonames) {
        let place = await getPlace(child.geonameId);
        await callback(place, geoid);
        await forEachChild(child.geonameId, callback);
    }
}

async function savePlace(out: Console, place: GeoPlace, parentId: string) {
    if (!place || !place.geonameId || !/^\d+$/.test("" + place.geonameId)) {
        logger.error(`not correct place `, place);
        return;
    }

    logger.info(`try save ${place.geonameId}`);
    //查找中文名称
    let primaryName;
    let _alternames = place.alternateNames || []
    for (let altername of _alternames) {
        if (!primaryName && altername.lang == 'en') {
            primaryName = altername.name;
            continue;
        }

        if (altername.lang == 'zh') {
            primaryName = altername.name;
            break;
        }
    }
    let letter;
    let py;
    if (primaryName) {
        py = pinyin(primaryName, {
            style: pinyin.STYLE_NORMAL
        });
        py = py.join(' ');
        letter = getLetter(py)
    } else {
        primaryName = place.asciiName;
        py = place.asciiName;
        letter = getLetter(py);
    }

    let geoCity = await DB.models.GeoName.findById(place.geonameId.toString())
    if (!geoCity) {
        await DB.models.GeoName.create({
            id: place.geonameId,
            data: JSON.stringify(place),
        });
    } else {
        logger.info(`jump geoname `, place.geonameId);
    }

    let city = await DB.models.City.findById(place.geonameId.toString());
    if (!city) {
        city = DB.models.City.build({
            id: place.geonameId,
            name: primaryName,
            letter: letter.toUpperCase(),
            timezone: place.timezone ? place.timezone.timeZoneId: '',
            lng:place.lng,
            lat:place.lat,
            parentId: parentId,
            pinyin: py,
        });
        city = await city.save()
        let alternames = place.alternateNames || [];
        alternames.push({
            lang: 'geonameid',
            name: place.geonameId.toString(),
        });
        let ps = place.alternateNames.map( async (altername) => {
            var cityAltname = DB.models.CityAltName.build({
                cityId: city.id,
                lang: altername.lang,
                value: altername.name,
            })
            cityAltname = await cityAltname.save()
            return cityAltname;
        })
        await Promise.all(ps);
    } else {
        logger.info(`jump city `, place.geonameId);
    }
    // out.log(`${place.geonameId},${(`${place.lng} ${place.lat}`)}${parentId},${place.name},${place.lng},${place.lat},${letter.toUpperCase()},${py}`);
    // await Bluebird.delay(1500);
}

function getLetter(str) {
    if (!str) {
        return str;
    }
    let arr = str.split(/\s/g);
    arr = arr.map((legment) => {
        if (legment && legment.length && /[A-Za-z]/.test(legment[0])) {
            return legment[0].toUpperCase();
        }
        return ''
    })
    return arr.join('');
}

let from = yargs.argv.from || 0;
let end = yargs.argv.end || from + 20;

async function main() {
    // let fsout = await fs.createWriteStream('./data.csv');
    // let out = new console.Console(fsout, fsout);
    let out = console;
    let countries = await getContries();
    if (end > countries.length) {
        end = countries.length;
    }
    //11-13可能处理不完善
    for (let i= from; i< end; i++) {
        let country = countries[i];
        // if (country.geonameId.toString() != '1559582') {
        //     continue;
        // }
        let countryId = country.geonameId;
        let countryPlace = await getPlace(countryId)
        await savePlace(out, countryPlace, null);
        await forEachChild(countryId, async (place: GeoPlace, parentId: string) => {
            await savePlace(out, place, parentId);
        });
    }
    // fsout.end();
}


main()
    .then((places) => {
        console.log("finish...")
    })
    .catch((err) => {
        console.error(err.stack ? err.stack : err);
    })

