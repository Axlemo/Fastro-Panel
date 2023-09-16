import assert from "assert";

import { UserModel } from "../../../../database/provider";

import { AuthManager, BadRequestResult, ForbiddenResult, InterfaceRoute, NoContentResult, RequestContext, UnauthorizedResult } from "../../../_classes";
import { IRequestResult } from "../../../_interfaces";
import { UserRole } from "../../../_types";

import Utils from "../../../../utils/Toolbox";

type LoginDetails = {
    username: string, password: string,
};

export class Login extends InterfaceRoute {
    constructor() {
        super({
            path: "auth/validate-login",
            methods: ["POST"],
            body: true,
        });
    }

    async onRequest(context: RequestContext): Promise<IRequestResult> {
        const data = context.input.body as LoginDetails;

        if (data.username && data.password) {
            const result = await AuthManager.checkLogin(data.username, data.password);

            if (result.success) {
                context.cookie(result.cookie!);
            }
            else {
                return !result.blocked
                    ? new UnauthorizedResult("Please check your credentials.")
                    : new ForbiddenResult("Your account is blocked.");
            }

            return new NoContentResult();
        }

        return new BadRequestResult("You must provide valid credentials.");
    }
};

type SignupDetails = {
    username: string, password: string, password_confirm: string,
};

export class Register extends InterfaceRoute {
    constructor() {
        super({
            path: "auth/register",
            methods: ["POST"],
            body: true,
            //blocked: true,
        });
    }

    async onRequest(context: RequestContext): Promise<IRequestResult> {
        const data = context.input.body as SignupDetails;

        if (Object.values(data).length === 3) {
            assert(data.username.length > 3, "Your username is too short.");
            assert(data.username.length <= 16, "Your username is too long.");
            assert(Utils.checkAlphanumeric(data.username), "Your username can only contain letters and numbers.");
            assert(data.password.length >= 8, "Your password is too short.");
            assert(data.password === data.password_confirm, "The passwords do not match.");
            assert(!(await UserModel.findOne({ where: { name: data.username } })), "That user already exists.");

            const user_index = Math.max(...(await UserModel.findAll()).map(
                item => item.id
            )) + 1;

            await UserModel.create({
                id: user_index,
                name: data.username,
                passwordHash: AuthManager.hashCredentials(data.password, data.username + user_index),
                roles: [UserRole.DEFAULT],
                disabled: false,
            });

            return new NoContentResult();
        }

        return new BadRequestResult("You must provide a username, password, and password confirmation.");
    }
};

type ChangePasswordDetails = {
    current_password: string, new_password: string, new_password_confirm: string,
};

export class ChangePassword extends InterfaceRoute {
    constructor() {
        super({
            path: "auth/change-password",
            methods: ["PATCH"],
            body: true,
        });
    }

    async onRequest(context: RequestContext): Promise<IRequestResult> {
        const data = context.input.body as ChangePasswordDetails;

        if (Object.values(data).length === 3) {
            assert(data.new_password, "You must provide a new password.");
            assert(data.new_password.length >= 8, "Your new password is too short.");
            assert(data.new_password === data.new_password_confirm, "The passwords do not match.");

            const user = context.session!.user!;
            assert(AuthManager.verifyCredentials(user, data.current_password), "Your current password is incorrect.");

            await user.update({
                passwordHash: AuthManager.hashCredentials(data.new_password, user.name + user.id),
            });

            return new NoContentResult();
        }

        return new BadRequestResult("You must provide your current password, new password, and new password confirmation.");
    }
};

export class Logout extends InterfaceRoute {
    constructor() {
        super({
            path: "auth/logout",
            methods: ["POST"],
            requiresLogin: true,
        });
    }

    async onRequest(context: RequestContext): Promise<IRequestResult> {
        context.session!.destroy();
        return new NoContentResult();
    }
};