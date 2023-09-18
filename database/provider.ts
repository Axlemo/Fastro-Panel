import { DataTypes, Sequelize } from "sequelize";

import { SessionModel, UserModel } from "./models";
import { UserRole } from "../system/_types";

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "dev.db",
});

UserModel.init({
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        validate: {
            len: [3, 16],
            isAlphanumeric: true,
        },
        allowNull: false,
    },
    passwordHash: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    roles: {
        type: DataTypes.JSON,
        defaultValue: [],
        allowNull: false,
    },
    disabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
}, { sequelize, tableName: "users" });

SessionModel.init({
    id: {
        type: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    secret: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    issue: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    expiry: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    remoteAddress: {
        type: DataTypes.STRING,
    },
}, { sequelize, tableName: "sessions" });

UserModel.hasMany(SessionModel, {
    sourceKey: "id",
    foreignKey: "userId",
    as: "sessions",
});

SessionModel.belongsTo(UserModel, {
    foreignKey: "userId",
    as: "user",
});

export async function connect_db() {
    await sequelize.authenticate();
    await sequelize.query("PRAGMA foreign_keys = false;");
    await sequelize.sync({ alter: true });
    await sequelize.query("PRAGMA foreign_keys = true;");

    // Changing the ID or NAME of accounts will invalidate the preset password
    await UserModel.findOrCreate({
        where: { name: "admin" },
        defaults: {
            id: 1,
            name: "admin",
            // Password is 'admin'
            passwordHash: "0a37b33d81e4e7f80ea89dd32e8ee12a939c154e6767cd035c467f8de1eadedc",
            roles: [UserRole.ADMIN],
            disabled: false,
        },
    });
}