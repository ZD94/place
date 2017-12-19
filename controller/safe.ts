/**
 * Created by wlh on 2017/12/15.
 */


'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
import * as request from 'request-promise';
import * as moment from 'moment';
import {DB} from '@jingli/database';
import { doc } from '@jingli/doc';

@Restful()
export default class SafeController extends AbstractController {

    constructor() {
        super()
    }

    $isValidId(id: string) {
        return /^\d+$/.test(id);
    }

    @doc("全球安全城市排行")
    @Router('/rank')
    async rank(req, res, next) {
        let dateStr = moment().format('YYYYMMDD');
        let safe = await DB.models['Safe'].findById(dateStr);
        if (!safe) {
            const regStr = `<tr>\\s*<td>(\\d+)\\.</td>\\s*<td\\sclass="table-safearound-country-flag">\\s*`
                + `<img\\ssrc="[^"]*"\\stitle="([^"]+)"\\swidth="24"\\sheight="24"/></td>\\s*`
                + `<td>\\s*<a\\shref="([^"]+)">(\\w+)</a>\\s*</td>\\s*`
                + `<td\\sclass="table-safearound-country-region">\\s*<a\\shref="([^"]+)">(\\w*)</a>\\s*</td>\\s*`
                + `<td>\\s*<span\\sclass="table-safearound-index\\s*[^"]*">([\\d\\.]*)<span>\\s*</td>\\s*</tr>`
            const reg = new RegExp(regStr, 'ig');
            let html = await request
                .get({
                    uri: 'https://safearound.com/danger-rankings/country-danger-ranking/',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36',
                        'referer': 'https://safearound.com/danger-rankings/cities/',
                        'pragma': 'no-cache'
                    }
                })

            let data = [];
            let group = null;

            do {
                group = reg.exec(html);
                if (group) {
                    data.push({
                        rank: group[1],
                        country: group[2],
                        link: group[3],
                        // country: group[5],
                        region: group[6],
                        score: group[7]
                    })
                }
            } while(group);
            safe = DB.models['Safe'].build({
                id: dateStr,
                data: data,
            });
            safe = await safe.save();
        }
        res.json(this.reply(0, safe));
    }
}