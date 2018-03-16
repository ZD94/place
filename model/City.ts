/**
 * Created by Administrator on 2017/7/18.
 */

import { Sequelize, DataTypes } from "sequelize";

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
            type: Types.NUMERIC(15, 11)
        },
        lat: {
            type: Types.NUMERIC(15, 11)
        },
        location: {
            type: "geography(POINT,4326)",
        },
        parentId: {
            type: Types.STRING(50),
        },
        pinyin: {
            type: Types.STRING(50),
        },
        fcode: {
            type: Types.STRING(50)
        },
        type: {
            type: Types.INTEGER
        },
        country_code: {
            type: Types.STRING(50)
        },
        "isCity": {
            type: Types.BOOLEAN,
            defaultValue: false,
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
    let model: any = DB.define('city', attributes, options);
    return model;
}

