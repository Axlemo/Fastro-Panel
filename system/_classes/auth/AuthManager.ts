import { Op } from "sequelize";
import { randomUUID, pbkdf2Sync } from "crypto";

import { SessionModel, UserModel } from "../../../database/provider";

import { User } from "../";
import { CookieFlags, CookieSitePolicy, ValidationData } from "../../_types";

import Conf from "../../../utils/Configuration";
import Utils from "../../../utils/Toolbox";

export default class AuthManager {
    static hashCredentials(passwd: string, salt: string) {
        return pbkdf2Sync(passwd, salt, 10000, 32, "sha256").toString("hex");
    }

    static verifyCredentials(user: UserModel, passwd: string): boolean {
        return this.hashCredentials(passwd, user.name + user.id) === user.passwordHash;
    }

    static async checkLogin(name: string, passwd: string): Promise<ValidationData> {
        const target = await UserModel.findOne({ where: { name: name } });

        if (target !== null && this.verifyCredentials(target, passwd)) {
            if (target.disabled) return { success: false, blocked: true };

            const token = Utils.random(Conf.Session.CookieLength, Conf.Session.SpecialCharacters);

            const date = new Date();
            date.setTime(+date + Conf.Session.ValidityTime);

            const user = new User(name, {
                id: target.id,
                passwd: target.passwordHash,
                perms: {
                    roles: target.roles,
                    disabled: target.disabled,
                },
            });

            await SessionModel.create({
                id: randomUUID(),
                secret: Utils.sha256(token),
                issue: new Date(Date.now()),
                expiry: date,
                userId: user.id,
            });

            return {
                success: true,
                cookie: {
                    name: Conf.Session.CookieName,
                    value: token,
                    path: "/",
                    expires: date,
                    samesite: CookieSitePolicy.STRICT,
                    flags: [
                        CookieFlags.HTTPONLY,
                    ],
                },
            };
        }
        else {
            return { success: false };
        }
    }

    static async getUserSession(token: string): Promise<SessionModel | undefined> {
        try {
            return await SessionModel.findOne({
                where: { secret: Utils.sha256(token) },
                include: [{ model: UserModel, as: "user" }],
            }) ?? undefined;
        }
        catch {
            return;
        }
    }

    static async getUserSessions(user_id: number): Promise<SessionModel[]> {
        return (await this.getAllSessions()).filter(session => session.userId === user_id);
    }

    static async getAllSessions(): Promise<SessionModel[]> {
        // Return only valid sessions
        return await SessionModel.findAll({
            where: { expiry: { [Op.gt]: new Date(Date.now()) } },
            include: [{ model: UserModel, as: "user" }],
        });
    }

    static async getSessionById(session_id: string): Promise<SessionModel | undefined> {
        return (await this.getAllSessions()).find(session => session.id === session_id);
    }
};