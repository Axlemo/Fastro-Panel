import { BadRequestResult, MethodNotAllowedResult } from "../result/status/4xxResult";
import { InterfaceRouteData, HttpMethod, RateLimitOptions } from "../../../_types";
import { IRequestResult } from "../../../_interfaces";

import Conf from "../../../../utils/Configuration";
import Route from "./Route";
import RequestContext from "../RequestContext";

export default class InterfaceRoute extends Route implements InterfaceRouteData {
    constructor(options: InterfaceRouteData) {
        super({
            path: Conf.Router.APIDirectory + options.path,
            requiresLogin: options.requiresLogin,
            requiredRoles: options.requiredRoles,
            blocked: options.blocked,
            body: options.body,
            query: options.query,
        });

        this.methods = options.methods;
        this.ratelimit = options.ratelimit;
    }

    methods: HttpMethod[];

    ratelimit?: RateLimitOptions;

    async GET(context: RequestContext): Promise<IRequestResult> {
        return new MethodNotAllowedResult();
    }

    async POST(context: RequestContext): Promise<IRequestResult> {
        return new MethodNotAllowedResult();
    }

    async PUT(context: RequestContext): Promise<IRequestResult> {
        return new MethodNotAllowedResult();
    }

    async PATCH(context: RequestContext): Promise<IRequestResult> {
        return new MethodNotAllowedResult();
    }

    async DELETE(context: RequestContext): Promise<IRequestResult> {
        return new MethodNotAllowedResult();
    }

    async OPTIONS(context: RequestContext): Promise<IRequestResult> {
        return new MethodNotAllowedResult();
    }

    // When the 'onRequest' function is not defined on an API, this gets called by the handler instead
    // What this implies is that the API accepts multiple methods, so the respective function is called
    async onRequest(context: RequestContext): Promise<IRequestResult> {
        const method = this[context.method as keyof typeof this];
        if (typeof method === "function") return method.call(this, context); // Manually assign 'this', or it will be undefined

        return new BadRequestResult();
    }
};