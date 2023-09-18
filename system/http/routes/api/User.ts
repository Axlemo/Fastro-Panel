import assert from "assert";

import { UserModel } from "../../../../database/models";

import { AuthManager, InterfaceRoute, JsonResult, NoContentResult, RequestContext } from "../../../_classes";
import { IRequestResult } from "../../../_interfaces";
import { UserRole } from "../../../_types";

export class UserInfo extends InterfaceRoute {
    constructor() {
        super({
            path: "users/identity",
            methods: ["GET"],
            requiresLogin: true,
        });
    }

    async onRequest(context: RequestContext): Promise<IRequestResult> {
        const user = context.session!.user!;

        return new JsonResult({
            Username: user.name,
            UserId: user.id,
            SessionId: context.session!.id,
            Permissions: user.roles?.map(
                item => UserRole[item] as string
            ),
        });
    }
};

export class UserList extends InterfaceRoute {
    constructor() {
        super({
            path: "users/list",
            methods: ["GET"],
            requiresLogin: true,
            requiredRoles: [UserRole.ADMIN],
        });
    }

    async onRequest(context: RequestContext): Promise<IRequestResult> {
        const user_array = await UserModel.findAll();
        const mapped_users: object[] = [];

        user_array.forEach(item => mapped_users.push({
            Username: item.name,
            UserId: item.id,
            Disabled: item.disabled,
            Permissions: item.roles?.map(
                item => UserRole[item] as string
            )
        }));

        return new JsonResult(mapped_users);
    }
};

type UserBlockDetails = {
    user_id: number, blocked: boolean,
};

type UserDeletionDetails = {
    user_id: number,
};

export class UserUpdate extends InterfaceRoute {
    constructor() {
        super({
            path: "users/update",
            methods: ["PATCH", "DELETE"],
            body: true,
            requiresLogin: true,
            requiredRoles: [UserRole.ADMIN],
        });
    }

    private async checkUser(userId: number): Promise<UserModel> {
        assert(userId !== undefined, "You must provide a user identifier.");

        const user = await UserModel.findOne({ where: { id: userId } });

        assert(user, "The specified user does not exist.");
        assert(user.id !== 1, "You cannot modify the initial user.");
        return user;
    }

    async PATCH(context: RequestContext): Promise<IRequestResult> {
        const data = context.input.body as UserBlockDetails;
        const user = await this.checkUser(data.user_id);

        await user.update({ disabled: data.blocked });

        return new NoContentResult();
    }

    async DELETE(context: RequestContext): Promise<IRequestResult> {
        const data = context.input.body as UserDeletionDetails;
        const user = await this.checkUser(data.user_id);

        await AuthManager.removeUserSessions(data.user_id);
        await user.destroy();

        return new NoContentResult();
    }
};