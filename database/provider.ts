import { UUID } from "crypto";

import {
    Sequelize, Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, NonAttribute, Association,
    HasManyGetAssociationsMixin, HasManyAddAssociationMixin, HasManySetAssociationsMixin, HasManyRemoveAssociationMixin
} from "sequelize";

import { UserRole } from "../system/_types";

const sequelize = new Sequelize({
    dialect: "sqlite",
    storage: "dev.db",
});

export class UserModel extends Model<InferAttributes<UserModel, { omit: "sessions" }>, InferCreationAttributes<UserModel, { omit: "sessions" }>> {
    declare id: CreationOptional<number>;

    declare name: string;
    declare passwordHash: string;
    declare roles: UserRole[];
    declare disabled: boolean;

    declare sessions?: NonAttribute<SessionModel[]>;

    declare getSessions: HasManyGetAssociationsMixin<SessionModel>;
    declare addSessions: HasManyAddAssociationMixin<SessionModel, UUID>;
    declare setSessions: HasManySetAssociationsMixin<SessionModel, UUID>;
    declare removeSessions: HasManyRemoveAssociationMixin<SessionModel, UUID>;

    declare static associations: {
        sessions: Association<UserModel, SessionModel>;
    };
}

export class SessionModel extends Model<InferAttributes<SessionModel>, InferCreationAttributes<SessionModel>> {
    declare id: CreationOptional<UUID>;

    declare secret: string;
    declare issue: Date;
    declare expiry: Date;

    declare userId: ForeignKey<UserModel["id"]>;
    declare user?: NonAttribute<UserModel>;

    get isValid(): NonAttribute<boolean> {
        return this.expiry > new Date(Date.now());
    }
}

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