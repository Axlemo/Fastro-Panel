import { UserRole } from "../../auth/UserData";
import { RateLimitOptions } from "../RateLimiter";
import { QueryOptions } from "./input/InputOptions";

export type HttpMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE"
    | "OPTIONS";

export type InterfaceRouteData = {
    path: string;

    methods: HttpMethod[];

    ratelimit?: RateLimitOptions;

    requiresLogin?: boolean;

    requiredRoles?: UserRole[];

    blocked?: boolean;

    query?: QueryOptions[];

    body?: boolean;
};