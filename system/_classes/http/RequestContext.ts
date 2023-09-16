import * as HTTP from "http";

import { SessionModel } from "../../../database/provider";

import { CookieOptions, ContentType, InputTypes, HttpMethod } from "../../_types";

import CookieBuilder from "./CookieBuilder";

type ContextBinding = {
    req: HTTP.IncomingMessage;
    res: HTTP.ServerResponse;
};

export default class RequestContext {
    constructor({ req, res }: ContextBinding, reqId: string, template: object, session?: SessionModel) {
        this.session = session;
        this.requestId = reqId;
        this.template = template;
        this.req = req;
        this.res = res;

        this.method = req.method as HttpMethod;

        this.input = {
            body: undefined,
            query: {},
        };
    }

    public requestId: string;

    public template: object;

    public session?: SessionModel;

    public input: InputTypes;

    public method: HttpMethod;

    public req: HTTP.IncomingMessage;

    private res: HTTP.ServerResponse;

    text(data: string, status?: number) {
        if (status) this.status(status);
        this.res.end(data, "utf-8");
    }

    json(json: object, status?: number) {
        if (status) this.status(status);
        this.res.end(JSON.stringify(json), "utf-8");
    }

    status(status: number): this {
        this.res.statusCode = status;
        return this;
    }

    header(header: string, value: string): this {
        this.res.setHeader(header, value);
        return this;
    }

    redirect(path: string, params?: { [key: string]: string }) {
        if (params) {
            Object.entries(params).forEach((param, index) => {
                // With the first parameter, '?' should be the delimiter, otherwise '&' is used
                const delimiter = index === 0 ? "?" : "&";
                path += `${delimiter}${param[0]}=${param[1]}`;
            });
        }

        this.status(302).header("Location", path).end();
    }

    contentType(type: ContentType): this {
        this.header("Content-Type", type);
        return this;
    }

    cookie(options: CookieOptions): this {
        this.header("Set-Cookie", new CookieBuilder(options).parse());
        return this;
    }

    end(content?: string) {
        this.res.end(content);
    }
};