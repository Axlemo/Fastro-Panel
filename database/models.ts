import { UUID } from "crypto";
import {
    Model, InferAttributes, InferCreationAttributes, CreationOptional, ForeignKey, NonAttribute, Association,
    HasManyGetAssociationsMixin, HasManyAddAssociationMixin, HasManySetAssociationsMixin, HasManyRemoveAssociationMixin
} from "sequelize";

import { UserRole } from "../system/_types";

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
    declare remoteAddress?: string;

    declare userId: ForeignKey<UserModel["id"]>;
    declare user?: NonAttribute<UserModel>;

    get isValid(): NonAttribute<boolean> {
        return this.expiry > new Date(Date.now());
    }
}