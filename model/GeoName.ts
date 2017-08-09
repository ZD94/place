/**
 * Created by wlh on 2017/8/8.
 */

'use strict';

import {Sequelize, DataTypes} from "sequelize";
export = function (DB: Sequelize, Types: DataTypes) {
    var attributes = {
        id: {
            type: Types.STRING(50),
            primaryKey: true,
        },
        data: {
            type: Types.JSONB
        }
    }
    var options = {
        tableName: "geonames",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        underscore: true,
    }
    let model = DB.define('GeoName', attributes, options);
    return model;
}