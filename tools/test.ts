/**
 * Created by Administrator on 2017/7/31.
 */
/**
 * Created by Administrator on 2017/7/28.
 */
/**
 * Created by Administrator on 2017/7/20.
 */

import {type} from "os";
import request = require('request-promise');
import fs = require('fs');
import Promise = require('bluebird');
import fs = require('fs-extra-promise');
import pinyin = require('pinyin');
import {DB} from  '@jingli/database';
import Bluebird = require("bluebird");
import {stringify} from "querystring";
import {Point} from "geojson";

const KEY = 'zd12321';
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
            username: KEY
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
    isPreferredName: boolean;
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

async function getPlace(geoid: string): GeoPlace {
    return await request<GeoPlace>({
        uri: 'http://api.geonames.org/getJSON',
        json: true,
        qs: {
            geonameId: geoid,
            username: KEY
        }
    });
}

async function forEachChild(geoid: string, callback: (place: GeoPlace, parentId: string) => Promise<any>) {
    let data = await request({
        uri: 'http://api.geonames.org/childrenJSON',
        json: true,
        qs: {
            geonameId: geoid,
            username: KEY,
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
    for (let altername of place.alternateNames) {
        if (altername.lang == 'en' || altername.lang == 'zh') {
            primaryName = altername.name;
            break;
        }
    }
    console.log(place,'-------------')
    let letter;
    let py;
    if (primaryName) {
        py = pinyin(primaryName, {
            style: pinyin.STYLE_NORMAL
        });
        letter = pinyin(primaryName, {
            style: pinyin.STYLE_FIRST_LETTER
        });
    } else {
        primaryName = place.asciiName;
        letter = pinyin(primaryName, {
            style: pinyin.STYLE_FIRST_LETTER
        });
        py = pinyin(primaryName, {
            style: pinyin.STYLE_NORMAL
        });
    }
    let city = await DB.models.City.findById(place.geonameId.toString());
    if (city) {
        return city;
    }

    city = DB.models.City.build({
        id: place.geonameId,
        name: primaryName,
        letter: letter.join('').toUpperCase(),
        timezone: place.timezone.timeZoneId,
        lng:place.lng,
        lat:place.lat,
        parentId: parentId,
        pinyin: py.join(' '),
    });
    city = await city.save()

    let alternames = place.alternateNames || [];
    alternames.push( {
        lang: 'geonameid',
        name: place.geonameId,
    });
    let ps = place.alternateNames.map( async (altername) => {
        var cityAltname = DB.models.CityAltName.build({
            city_id: city.id,
            lang: altername.lang,
            value: altername.name,
        })
        cityAltname = await cityAltname.save()
        return cityAltname;
    })
    await Promise.all(ps);

    out.log(`${place.geonameId},${(`${place.lng} ${place.lat}`)}${parentId},${place.name},${place.lng},${place.lat},${place.timezone.timeZoneId},${letter.join('').toUpperCase()},${py.join(' ')}`);
    // await Bluebird.delay(1500);
}

function getLetter(str) {
    let arr = str.split(/\s/g);
    arr = arr.map((legment) => {
        if (legment && legment.length && /[A-Za-z]/.test(legment[0])) {
            return legment[0].toUpperCase();
        }
        return ''
    })
    return arr.join('');
}

async function main() {
    let fsout = await fs.createWriteStream('./data.csv');
    let out = new console.Console(fsout, fsout);
    let countries = await getContries();
    for (let country of countries) {
        if (country.countryName.toLowerCase() != 'china') {
            continue;
        }
        let countryId = country.geonameId;
        let children = await forEachChild(countryId, async (place: GeoPlace, parentId: string) => {
            console.log("parentId==>", parentId)
            await savePlace(out, place, parentId);
        });
    }
    fsout.end();
}

main()
    .then((places) => {
        console.log("finish...")
    })
    .catch((err) => {
        console.error(err.stack ? err.stack : err);
    })

