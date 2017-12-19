import * as fs from 'fs';
import * as request from 'request-promise';
import * as path from 'path';
const unzip = require('unzip2');

export async function downloadPlace(code: string, dir: string) { 
    let url = `http://download.geonames.org/export/dump/${code.toUpperCase()}.zip`;
    let dist = path.join(dir, `./${code}.zip`);
    return downloadZip(url, dist);
}

export async function downloadAlternateName(code: string, dir: string) { 
    let url = `http://download.geonames.org/export/dump/alternatenames/${code.toUpperCase()}.zip`;
    let dist = path.join(dir, `./${code}.zip`);
    return downloadZip(url, dist);
}

export async function downloadZip(url: string, dist: string): Promise<string> {
    let data = await request({
        uri: url,
        encoding: null,
    });
    let f = dist;
    return new Promise<string>((resolve, reject) => { 
        fs.writeFile(f, data, {
            encoding: null,
        }, (err) => { 
            if (err) { 
                return reject(err);
            }
            resolve(f as string);
        });
    })
}

export function decompress(f: string, distDir: string) { 
    // let dist = path.join(distDir);
    return new Promise((resolve, reject) => { 
        fs.createReadStream(f)
            .pipe(unzip.Extract({ path: distDir }))
            .on('close', () => { 
                resolve(true);
            })
            .on("error", (err) => { 
                reject(err);
            })
    })

}