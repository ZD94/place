/**
 * Created by Administrator on 2017/7/18.
 */

import {Sequelize, DataTypes} from "sequelize";
export = function (DB: Sequelize, Types: DataTypes) {
    var attributes = {
        id: {
            type: Types.STRING(50),
            primaryKey: true,
        },
        name: {
            type: Types.STRING(50),
        },
        letter: {
            type: Types.STRING(50),
        },
        timezone: {
            type: Types.STRING(100)
        },
        lng: {
            type: Types.REAL
        },
        lat: {
            type: Types.REAL
        },
        parentId: {
            type: Types.STRING(50),
        },
        pinyin: {
            type: Types.STRING(50),
        }
    }
    var options = {
        tableName: "cities",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        underscore: true,
    }
    let model = DB.define('city', attributes, options);
    return model;
}

