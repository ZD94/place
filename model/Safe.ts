/**
 * Created by Administrator on 2017/7/18.
 */

import {Sequelize, DataTypes} from "sequelize";
export = function (DB: Sequelize, Types: DataTypes) {
    var attributes = {
        id: {
            type: Types.STRING(8),
            primaryKey: true,
        },
        data: {
            type: Types.JSONB
        }
    }
    var options = {
        tableName: "safe",
        timestamps: true,
        underscore: true,
    }
    let model: any = DB.define('Safe', attributes, options);
    return model;
}

