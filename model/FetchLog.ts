/**
 * Created by Administrator on 2017/7/18.
 */

import { Sequelize, DataTypes } from "sequelize";
enum STATUS { 
    HANDLE_ERROR = -2,
    DOWNLOAD_ERROR = -1,
    DOWNLOADING = 0,
    DOWNLOADED = 1,
    FINISHED = 2
}

export = function (DB: Sequelize, Types: DataTypes) {
    var attributes = {
        id: {
            type: Types.STRING(50),
            primaryKey: true,
        },
        filename: {
            type: Types.STRING(255)
        },
        status: {
            type: Types.INTEGER,
            defaultValue: STATUS.DOWNLOADING,
        }
    }
    var options = {
        tableName: "fetch_logs",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        underscore: true,
    }
    let model: any = DB.define('FetchLog', attributes, options);
    return model;
}

