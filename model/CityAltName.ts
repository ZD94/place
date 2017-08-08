/**
 * Created by Administrator on 2017/7/18.
 */

import {Sequelize} from "sequelize";
export = function (DB: Sequelize, Types: Sequelize.Sequelize.DataTypes) {
    var attributes = {
        cityId:{
            type: Types.STRING(50)
        },
        lang:{
            //geoName
            type: Types.STRING(50)
        },
        value:{
            //geoNameId
            type: Types.STRING(100)
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