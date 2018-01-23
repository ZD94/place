/**
 * Created by Administrator on 2017/7/18.
 */

import {Sequelize, DataTypes} from "sequelize";
export = function (DB: Sequelize, Types: DataTypes) {
    var attributes = {
        id: {
            type: Types.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        cityId:{
            type: Types.STRING(50)
        },
        lang:{
            //geoName
            type: Types.STRING(50)
        },
        value:{
            //geoNameId
            type: Types.STRING(255)
        },
        isRecommend: {
            type: Types.BOOLEAN,
            defaultValue: false,
        }
    }
    var options = {
        tableName:'city_alternate_names',
        timestamps:true,
        createdAt:'created_at',
        updatedAt:'updated_at',
        deletedAt:'daleted_at',
        underscore:true,
    }
    return DB.define('CityAlternateName',attributes,options)
}