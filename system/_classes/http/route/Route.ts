import { IRequestHandler, IRequestResult } from "../../../_interfaces";
import { QueryOptions, RouteData, UserRole } from "../../../_types";
import { NoContentResult } from "../result/status/2xxResult";

import RequestContext from "../RequestContext";

export default class Route implements RouteData, IRequestHandler {
    constructor(options: RouteData) {
        this.path = options.path;
        this.body = options.body;
        this.query = options.query;
        this.requiresLogin = options.requiresLogin;
        this.requiredRoles = options.requiredRoles;
        this.blocked = options.blocked;
    }

    path: string;

    requiresLogin?: boolean;

    requiredRoles?: UserRole[];

    blocked?: boolean;

    query?: QueryOptions[];

    body?: boolean;

    isUserAuthorized(context: RequestContext) {
        if (!this.requiredRoles || !context.session) return true;

        return context.session.user?.roles.some(r => this.requiredRoles!.includes(r)) ?? false;
    }

    async onRequest(context: RequestContext): Promise<IRequestResult> {
        return new NoContentResult();
    }
};