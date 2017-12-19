
import { countires } from './country';
import { downloadZip, decompress, downloadPlace, downloadAlternateName } from './download';
import * as path from 'path';
import { handleFile } from './handle';
import * as fs from 'fs';
import { DB } from '@jingli/database';
const pinyin = require("pinyin");

async function tryMkdir(dir: string) { 
    return new Promise((resolve, reject) => {
        fs.mkdir(dir, function (err) {
            if (!err) {
                return resolve(true);
            }
            if (err && /exists/i.test(err.message)) {
                return resolve(true);
            }
            reject(err);
        })
    })
}

export interface GeoPlace { 
    id: string;
    name: string;
    asciiname: string;
    latitude: string;
    longitude: string;
    fcode: string;
    countryCode: string;
    timezone: string;
    modifyDate: string;
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

// const f = path.join(__dirname, '../data/' + Date.now() + '.sql');
// const writeStream = fs.createWriteStream(f);

async function trySaveCity(obj: GeoPlace) { 
    let city = await DB.models['city'].findById(obj.id);
    if (city) { 
        return city;
    }
    let letter;
    let py;
    py = pinyin(obj.name, {
        style: pinyin.STYLE_NORMAL
    });
    py = py.join(' ');
    letter = getLetter(py)

    let sql = `INSERT INTO public.cities_robot 
                    ( id, letter, pinyin, name, lat, lng, country_code,
                        location, timezone, "parentId", created_at, updated_at)
               VALUES('${obj.id}', '${letter}', '${py}', '${obj.name}', '${obj.latitude}', '${obj.longitude}', '${obj.countryCode.toUpperCase()}',
                null, '${obj.timezone}', null, now(), now());`;
    await DB.query(sql);
    // writeStream.write(sql + '\n');
    // console.log(sql);
}

async function parsePlace(arr: string[]) {
    return {
        id: arr[0],
        name: arr[1],
        asciiname: arr[2],
        latitude: arr[4],
        longitude: arr[5],
        fcode: arr[7],
        countryCode: arr[8],
        timezone: arr[17],
        modifyDate: arr[18]
    } as GeoPlace;
}

export async function main() { 
    let dist = path.join(__dirname, '../data');
    await tryMkdir(dist);
    let alternateDist = path.join(dist, 'alternatenames')
    await tryMkdir(alternateDist);

    let d = new Date();
    let weekday = d.getDay();
    let limit = Math.ceil(countires.length / 7);
    let start = (weekday - 1) * limit;
    let end = (weekday - 1) * limit + limit;
    if (end > countires.length) { 
        end = countires.length;
    }
    console.log(`本次需要处理${countires[start]}-${countires[end]},共 ${end-start}`);
    for (let i = start; i < end; i++) {
        let country = countires[i];
        console.time(country);
        let f = await downloadPlace(country, dist);
        await decompress(f, dist);
        let alternateFile = await downloadAlternateName(country, alternateDist);

        let txtFile = path.join(dist, `${country}.txt`);
        await handleFile(txtFile, async (row: string) => { 
            try {
                let arr = row.split(/\t/g);
                let place = await parsePlace(arr);
                await trySaveCity(place);
            } catch (err) { 
                console.error(err);
            }
        })
        console.timeEnd(country);
    }
}
