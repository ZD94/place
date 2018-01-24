/**
 * Created by wlh on 2018/1/24.
 */

'use strict';

import cache from '@jingli/cache';
import {DB} from '@jingli/database';

const tables = [
    'cities_ad',
    'cities_ae',
    'cities_af',
    'cities_ag',
    'cities_ai',
    'cities_al',
    'cities_am',
    'cities_ao',
    'cities_aq',
    'cities_ar',
    'cities_as',
    'cities_at',
    'cities_au',
    'cities_aw',
    'cities_ax',
    'cities_az',
    'cities_ba',
    'cities_bb',
    'cities_bd',
    'cities_be',
    'cities_bf',
    'cities_bg',
    'cities_bh',
    'cities_bi',
    'cities_bj',
    'cities_bl',
    'cities_bm',
    'cities_bn',
    'cities_bo',
    'cities_bq',
    'cities_br',
    'cities_bs',
    'cities_bt',
    'cities_bv',
    'cities_bw',
    'cities_by',
    'cities_bz',
    'cities_ca',
    'cities_cc',
    'cities_cd',
    'cities_cf',
    'cities_cg',
    'cities_ch',
    'cities_ci',
    'cities_ck',
    'cities_cl',
    'cities_cm',
    'cities_cn',
    'cities_cn2',
    'cities_co',
    'cities_cr',
    'cities_cu',
    'cities_cv',
    'cities_cw',
    'cities_cx',
    'cities_cy',
    'cities_cz',
    'cities_de',
    'cities_dj',
    'cities_dk',
    'cities_dm',
    'cities_do',
    'cities_dz',
    'cities_ec',
    'cities_ee',
    'cities_eg',
    'cities_eh',
    'cities_er',
    'cities_es',
    'cities_et',
    'cities_fi',
    'cities_fj',
    'cities_fk',
    'cities_fm',
    'cities_fo',
    'cities_fr',
    'cities_ga',
    'cities_gb',
    'cities_gd',
    'cities_ge',
    'cities_gf',
    'cities_gg',
    'cities_gh',
    'cities_gi',
    'cities_gl',
    'cities_gm',
    'cities_gn',
    'cities_gp',
    'cities_gq',
    'cities_gr',
    'cities_gs',
    'cities_gt',
    'cities_gu',
    'cities_gw',
    'cities_gy',
    'cities_hk',
    'cities_hm',
    'cities_hn',
    'cities_hr',
    'cities_ht',
    'cities_hu',
    'cities_id',
    'cities_ie',
    'cities_il',
    'cities_im',
    'cities_in',
    'cities_io',
    'cities_iq',
    'cities_ir',
    'cities_is',
    'cities_it',
    'cities_je',
    'cities_jm',
    'cities_jo',
    'cities_jp',
    'cities_ke',
    'cities_kg',
    'cities_kh',
    'cities_ki',
    'cities_km',
    'cities_kn',
    'cities_kp',
    'cities_kr',
    'cities_kw',
    'cities_ky',
    'cities_kz',
    'cities_la',
    'cities_lb',
    'cities_lc',
    'cities_li',
    'cities_lk',
    'cities_lr',
    'cities_ls',
    'cities_lt',
    'cities_lu',
    'cities_lv',
    'cities_ly',
    'cities_ma',
    'cities_mc',
    'cities_md',
    'cities_me',
    'cities_mf',
    'cities_mg',
    'cities_mh',
    'cities_mk',
    'cities_ml',
    'cities_mm',
    'cities_mn',
    'cities_mo',
    'cities_mp',
    'cities_mq',
    'cities_mr',
    'cities_ms',
    'cities_mt',
    'cities_mu',
    'cities_mv',
    'cities_mw',
    'cities_mx',
    'cities_my',
    'cities_mz',
    'cities_na',
    'cities_nc',
    'cities_ne',
    'cities_nf',
    'cities_ng',
    'cities_ni',
    'cities_nl',
    'cities_no',
    'cities_np',
    'cities_nr',
    'cities_nu',
    'cities_nz',
    'cities_om',
    'cities_pa',
    'cities_pe',
    'cities_pf',
    'cities_pg',
    'cities_ph',
    'cities_pk',
    'cities_pl',
    'cities_pm',
    'cities_pn',
    'cities_pr',
    'cities_ps',
    'cities_pt',
    'cities_pw',
    'cities_py',
    'cities_qa',
    'cities_re',
    'cities_ro',
    'cities_rs',
    'cities_ru',
    'cities_rw',
    'cities_sa',
    'cities_sb',
    'cities_sc',
    'cities_sd',
    'cities_se',
    'cities_sg',
    'cities_sh',
    'cities_si',
    'cities_sj',
    'cities_sk',
    'cities_sl',
    'cities_sm',
    'cities_sn',
    'cities_so',
    'cities_sr',
    'cities_ss',
    'cities_st',
    'cities_sv',
    'cities_sx',
    'cities_sy',
    'cities_sz',
    'cities_tc',
    'cities_td',
    'cities_tf',
    'cities_tg',
    'cities_th',
    'cities_tj',
    'cities_tk',
    'cities_tl',
    'cities_tm',
    'cities_tn',
    'cities_to',
    'cities_tr',
    'cities_tt',
    'cities_tv',
    'cities_tw',
    'cities_tz',
    'cities_ua',
    'cities_ug',
    'cities_um',
    'cities_us',
    'cities_uy',
    'cities_uz',
    'cities_va',
    'cities_vc',
    'cities_ve',
    'cities_vg',
    'cities_vi',
    'cities_vn',
    'cities_vu',
    'cities_wf',
    'cities_ws',
    'cities_xk',
    'cities_ye',
    'cities_yt',
    'cities_za',
    'cities_zm',
    'cities_zw'
]

export async function init() {
    for(let table of tables) {
        await cacheTable(`city.`+table);
    }
}

function getKey(key: string) {
    return 'table:' + key;
}

export async function getTableName(id: string) {
    let key = getKey(id);
    return cache.readAs<string>(key);
}

export async function getPlace(id: string) {
    let tableName = await getTableName(id);
    if (!tableName)
        return null;
    let columns = Object.keys(DB.models['City'].attributes)
    columns = columns.map( (column) => {
        return `"${column}"`;
    })
    let sql = `SELECT ${columns.join(',')} FROM ${tableName} WHERE id = '${id}'`;
    let [rows, ] = await DB.query(sql);
    if (!rows || !rows.length)
        return null;
    return DB.models['City'].build(rows[0]);
}

export async function cacheTable(tableName: string) {
    let countTimeKey = '缓存'+tableName+'与ID关系'
    console.time(countTimeKey);
    let total = await count(tableName);
    let page = 1;
    let perPage = 1000;
    let offset = (page-1) * perPage;
    let pages = Math.ceil(total/perPage);
    do {
        let key = `${tableName}:${pages}:${page}`;
        // console.time(key);
        let sql = `SELECT id FROM ${tableName} OFFSET ${offset} LIMIT ${perPage}`;
        let [rows,] = await DB.query(sql);
        if (!rows.length) {
            break;
        }
        for(let row of rows) {
            await cacheTableNameWithId(row['id'], tableName);
        }
        page++;
        // console.timeEnd(key);
    } while(page <= pages);
    console.timeEnd(countTimeKey);
}

async function cacheTableNameWithId(id: string, tableName: string) {
    let key = getKey(id);
    let expire = 30 * 24 * 60 * 60;
    if (await cache.read(key)) {
        await cache.remove(key);
    }
    await cache.write(key, tableName, expire);
}

async function count(tableName: string) {
    let totalSQL = `select count(1) as count FROM ${tableName}`;
    let [rows,] = await DB.query(totalSQL);
    return rows[0]['count'];
}