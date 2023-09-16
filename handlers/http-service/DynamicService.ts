import { AssertionError } from "assert";

import { DirectoryRoute, InputHandler, InterfaceRoute, RequestContext } from "../../system/_classes";
import { IHttpServiceHandler } from "../../system/_interfaces";
import { ContentType, HttpMethod } from "../../system/_types";
import { Routes } from "../../system/http/routes";

import HTTPServer from "../../server";
import Conf from "../../utils/Configuration";

export default class DynamicService implements IHttpServiceHandler {
    constructor(base: HTTPServer) {
        this.base = base;
    }

    base: HTTPServer;

    async process(context: RequestContext, url: string) {
        const route = Routes.find(item => item.path === url);

        if (route) {
            if (route instanceof DirectoryRoute) {
                if (route.blocked || !route.isUserAuthorized(context)) return this.base.renderActionFailure(context, Conf.Static.Integrated.ErrorFiles.Unauthorized, 403);
                if (context.method !== "GET") return context.status(405).end();
            }
            else if (route instanceof InterfaceRoute) {
                if (route.blocked || !route.isUserAuthorized(context)) return context.status(403).end();
                if (!route.methods.includes(context.method)) return context.status(405).end();
            }

            if (context.session?.isValid || !route.requiresLogin) {
                if (route instanceof DirectoryRoute) {
                    context.contentType(ContentType.HTML);

                    if (context.session?.isValid && route.redirectIfAuthorized) {
                        return context.redirect(route.redirectIfAuthorized);
                    }
                }

                // Check that all inputted data is valid
                if (await InputHandler.handle(context, route)) {
                    try {
                        const action = await route.onRequest(context), result = await action.execute(context);

                        context.end(result ?? undefined);
                    }
                    catch (error) {
                        let e = error as Error;

                        // AssertionError is thrown when invalid input data types are detected
                        switch (e?.constructor) {
                            case AssertionError:
                                return context.status(400).end(e.message);
                        }

                        // Other exceptions lead to a general service error
                        this.base._log(`Directory/Interface resource exception from: ${context.requestId} -> ${e?.stack + e?.message}`, "yellow");

                        if (route instanceof InterfaceRoute) return context.text("Internal Server Error", 500);

                        this.base.renderActionFailure(context, Conf.Static.Integrated.ErrorFiles.SvrError, 500);
                    }
                }
                else {
                    context.status(400).end("Invalid data submitted.");
                }
            }
            else if (!context.session?.isValid) {
                if (route instanceof InterfaceRoute) {
                    return context.status(401).end();
                }

                //this.base.renderActionFailure(context, Conf.Static.Integrated.ErrorFiles.Unauthorized, 401);

                context.redirect(Conf.Router.DefaultRoute, {
                    "redir_after": context.req.url!.split("?")[0], // Redirect to the requested page after login, ignore the query
                });
            }
        }
        else {
            if (url.startsWith(Conf.Router.APIDirectory)) return context.text(`Not Found: ${url}`, 404);

            this.base.renderActionFailure(context, Conf.Static.Integrated.ErrorFiles.NotFound, 404);
        }
    }
};