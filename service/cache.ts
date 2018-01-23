/**
 * Created by wlh on 2018/1/23.
 */

'use strict';

import cache from '@jingli/cache';
import { DB } from '@jingli/database';

//系统启动时候，先将数据加入到redis中
export async function init() {
    let page = 1;
    let perPage = 100;
    let totalPage = 0;
    console.log('将旧ID与新ID对应关系加入cache中....')
    do {
        let {rows, count} = await pager(page, perPage);
        if (!rows || !rows.length) {
            break;
        }
        totalPage = Math.ceil(count/ perPage);
        console.log('总页数:', totalPage, '总条数:', count, '当前页:', page, '每页条数:', perPage);
        await cacheCityIds(rows);
        page++;
    } while(page <= totalPage && totalPage);
}

export async function getNewCityId(oldId: string) :Promise<string> {
    let key = getCacheKey(oldId);
    let newId = await cache.read(key);
    newId = newId.toString();
    return newId;
}

export async function cacheCityId(oldId: string, newId: string) {
    let key = getCacheKey(oldId);
    if (await cache.read(key)) {
        await cache.remove(key);
    }
    //失效日期设置为30days
    let expire = 30 * 24 * 60 * 60 * 1000;
    await cache.write(key, newId, expire);
}

async function cacheCityIds(rows: {cityId: string, value: string}[]) {
    for(let row of rows) {
        let cityId = row.cityId;
        let value = row.value;
        await cacheCityId(value, cityId);
    }
}

function getCacheKey(key: string) {
    return `cityid:${key}`;
}

async function pager(page: number, perPage: number = 50) {
    if (page < 1) {
        page = 1;
    }
    let offset = (page - 1) * perPage;
    let opts = {attributes: ["cityId", "value"], where: {lang: 'jlcityid'}, offset: offset, limit: perPage}
    let ret = await DB.models['CityAltName'].findAndCount(opts);
    return ret
}