/**
 * Created by Administrator on 2017/7/18.
 */

import {Sequelize} from "sequelize";
export= function(DB: Sequelize, Types: Sequelize.Sequelize.DataTypes) {
    var attributes = {
        id: {
            type: Types.STRING(50),
            primaryKey: true,
        },
        //
    }
    var options = {
        tableName: "places",
        timestamps: true,
        createdAt: "created_at",
        updatedAt: "updated_at",
        deletedAt: "deleted_at",
        underscore: true,
    }
    return DB.define('Place', attributes, options)
}
