/**
 * Created by wlh on 2017/12/14.
 */


'use strict';
import {AbstractController, Restful} from "@jingli/restful";
import * as request from "request-promise";
import WeatherVm from "../vm/weather-vm";

@Restful()
export class Weather extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\d+$/.test(id) || /^CTW?_\d+$/.test(id);
    }

    async get(req, res, next) {
        let {id} = req.params;
        let result = await request
            .get({
                uri: `http://d1.weather.com.cn/weather_index/101010100.html?_=${Date.now()}`,
                headers: {
                    'Referer': 'http://www.weather.com.cn/',
                    'Pragma': 'no-cache',
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.94 Safari/537.36'
                }
            })
        let reg = /var\sdataSK\s*=\s*(\{[^}]+})/;
        let groups = reg.exec(result);
        let data = null;
        if (groups) {
            data = JSON.parse(groups[1]);
            data = new WeatherVm(data);
        }
        res.json(this.reply(0, data));
    }
}