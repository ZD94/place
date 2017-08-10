/**
 * Created by Administrator on 2017/7/31.
 */

import request = require('request-promise');
global.Promise = require('bluebird');
import fs = require('fs-extra-promise');
import pinyin = require('pinyin');
import {DB} from  '@jingli/database';
import Bluebird = require("bluebird");
import yargs = require("yargs");

let KEY = [
    // 'wangpeng',
    // 'zelinlee0303', 'zhangdong', 'zd12321',
    // 'forevertimes', 'jack2017', 'mr.he', 'woshilzl', 'zd121',
    // 'wanglihui', 'wanglihui_sjz',
]

KEY = yargs.argv.keys || ['wangpeng', 'zelinlee0303', 'zhangdong', 'zd12321'];

let useNum = 0;
let keyIndex = 0;
function getKey() {
    ++useNum;
    if (useNum >= 1000) {
        keyIndex = keyIndex+1;
        useNum = 0;
    }
    if (keyIndex >= KEY.length) {
        keyIndex = 0;
    }
    return KEY[keyIndex];
}

export interface ICity {
    geoid: string;
    name: string;
}

//得到国家信息
async function getContries() {
    const URL = 'http://api.geonames.org/countryInfoJSON';
    let data = await request({
        uri: URL,
        json: true,
        qs: {
            username: getKey(),
            lang: 'zh'
        }
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
    return await request<GeoPlace>({
        uri: 'http://api.geonames.org/getJSON',
        json: true,
        qs: {
            geonameId: geoid,
            username: getKey(),
        }
    });
}

async function forEachChild(geoid: string, callback: (place: GeoPlace, parentId: string) => Promise<any>) {
    let data = await request({
        uri: 'http://api.geonames.org/childrenJSON',
        json: true,
        qs: {
            geonameId: geoid,
            username: getKey(),
        }
    });
    if (!data.geonames) {
        console.error(data)
        return;
    }
    for (let child of data.geonames) {
        console.log("child.geonameId==>", child.geonameId);
        let place = await getPlace(child.geonameId);
        await callback(place, geoid);
        await forEachChild(child.geonameId, callback);
    }
}

async function savePlace(out: Console, place: GeoPlace, parentId: string) {

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
    let city = await DB.models.City.findById(place.geonameId.toString());
    if (city) {
        return city;
    }

    await DB.models.GeoName.create({
        id: place.geonameId,
        data: JSON.stringify(place),
    });

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

    out.log(`${place.geonameId},${(`${place.lng} ${place.lat}`)}${parentId},${place.name},${place.lng},${place.lat},${letter.toUpperCase()},${py}`);
    // await Bluebird.delay(1500);
}

function getLetter(str) {
    console.log("str", str)
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

        let children = await forEachChild(countryId, async (place: GeoPlace, parentId: string) => {
            console.log("parentId==>", parentId)
            try {
                await savePlace(out, place, parentId);
            } catch(err) {
                out.error(err.stack);
            }
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

