/**
 * Created by wlh on 2017/12/14.
 */

'use strict';

export default class WeatherVm {
    cityname: string;
    temp: string;
    tempf: string;
    WD: string;
    wde: string;
    WS: string;
    wse: string;
    SD: string;
    time: string;
    weather: string;
    weathere: string;
    weathercode: string;
    qy: string;
    njd: string;
    sd: string;
    rain: string;
    rain24h: string;
    aqi: string;
    limitnumber: string;
    aqi_pm25: string;
    date: string;

    constructor(obj: any) {
        for(let key in obj) {
            this[key] = obj[key];
        }
    }

    toJSON() {
        let obj: any = {}
        for(let key in this) {
            obj[key] = this[key];
        }
        return obj;
    }
}