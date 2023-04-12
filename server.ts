import * as HTTP from "http";
import * as EJS from "ejs";
import * as XSS from "xss";
import * as WS from "ws";

import { randomUUID } from "crypto";

import { RequestContext, AuthManager, DirectoryRoute, InterfaceRoute, Session } from "./system/_classes";
import { IHttpServiceHandler } from "./system/_interfaces";
import { ContentType } from "./system/_types";
import { Routes, loadRoutes } from "./system/http/routes";

import StaticService from "./handlers/http-service/StaticService";
import DynamicService from "./handlers/http-service/DynamicService";
import WebsocketService from "./handlers/WebsocketService";

import LogDelegate from "./utils/Logging";
import Conf from "./utils/Configuration";
import Utils from "./utils/Toolbox";

export default class HTTPServer {
    constructor(log: LogDelegate) {
        this._log = log;

        if (Conf.Websocket.EnableWebsocket) this.initWS();
        this.initHTTP();

        log("Server loaded!", "blue");
        log(`Global content cache key: ${this._cacheKey}`, "cyan");
    }

    private staticHandler!: IHttpServiceHandler;
    private dynamicHandler!: IHttpServiceHandler;
    private websocketHandler!: WebsocketService;

    private _cacheKey = Utils.nonce();

    public _log: LogDelegate;

    private initHTTP() {
        loadRoutes().then(() => {
            for (const route of Routes) {
                if (route instanceof InterfaceRoute) {
                    route.methods.forEach(method => this.methods[method] = true);
                }
                else if (route instanceof DirectoryRoute) {
                    this.methods["GET"] = true;
                }
            }
        });

        this.staticHandler = new StaticService(this);
        this.dynamicHandler = new DynamicService(this);

        this.listenHTTP();
    }

    private initWS() {
        this.websocketHandler = new WebsocketService(new WS.Server({ noServer: true }), this);

        this.listenWS();

        this._log("###   WebSocket service is active!   ###", "green");
    }

    private listenHTTP() {
        const server = HTTP.createServer((req, res) => {
            try {
                const context = new RequestContext({ req: req, res: res }, randomUUID(),
                    AuthManager.getSession(Utils.getCookies(req)[Conf.Session.CookieName]),
                );

                // Ensure that both the URL and method are not undefined
                if (!context.req.url || !context.req.method) return context.status(400).end();

                const url = context.req.url.split("?")[0];
                const method = context.method;

                if (this.methods[method]) { // Check if the method is valid globally
                    if (Conf.Security.AddSecurityHeaders) this.applySecurityHeaders(context);
                    this.applyCustomHeaders(context);

                    if (url === "/" && Conf.Router.EnableDefaultRedirect) {
                        context.redirect(Conf.Router.DefaultRoute);
                    }
                    else if (!url.startsWith(Conf.Static.VirtualDirectory) || !Conf.Static.EnableStaticFileServer) {
                        this.dynamicHandler.process(context, url);
                    }
                    else {
                        if (method !== "GET") return context.status(405).end();

                        this.staticHandler.process(context, url);
                    }
                }
                else {
                    this._log(`Forbidden method [${method}] requested by: ${context.requestId}.`);

                    context.status(405).end();
                }
            }
            catch (error) {
                let e = error as Error;

                this._log(e.message + e.stack, "redBright");

                res.statusCode = 500;
                res.end();
            }
        }).listen(process.env.PORT || Conf.Server.DefaultPort);

        if (Conf.Websocket.EnableWebsocket) {
            server.on("upgrade", (req, socket, head) => {
                const session = AuthManager.getSession(Utils.getCookies(req)[Conf.Session.CookieName]);

                if (!session?.isValid()) return req.destroy();

                this.websocketHandler.server.handleUpgrade(req, socket, head, (ws) => {
                    this.websocketHandler.server.emit("connection", ws, session);
                });
            });
        }
    }

    private listenWS() {
        this.websocketHandler.server.on("connection", (ws, session: Session) => {
            this.websocketHandler.socketAttached(ws, session);

            ws.on("message", (data: string) => {
                this.websocketHandler.incomingMessage(data, session);
            });

            ws.on("close", this.websocketHandler.socketDetached);
        });
    }

    renderSharedTemplate(content: string) {
        return EJS.render(XSS.stripCommentTag(content), {
            copyright: `${new Date().getUTCFullYear()} - Universe`,
            version: this._cacheKey,
        });
    }

    async renderActionFailure(context: RequestContext, path: string, status: number = 200) {
        const data = await Utils.readFile(Conf.Static.Integrated.FileDirectory + path);

        context.contentType(ContentType.HTML);
        context.status(status);

        context.end(
            EJS.render(XSS.stripCommentTag(data), {
                reqId: context.requestId,
                url: context.req.url,
            })
        );
    }

    private applyCustomHeaders(context: RequestContext) {
        context.header("Server", "Abstractor");
    }

    private applySecurityHeaders(context: RequestContext) {
        context.header("Content-Security-Policy", "block-all-mixed-content;");
        context.header("Referrer-Policy", "no-referrer");
        context.header("Strict-Transport-Security", "max-age: 15552000; includeSubDomains; preload;");
        context.header("X-Content-Type-Options", "nosniff");
        context.header("X-Download-Options", "noopen");
        context.header("X-Frame-Options", "SAMEORIGIN");
        context.header("X-Permitted-Cross-Domain-Policies", "none");
        context.header("X-XSS-Protection", "0");
    }

    private methods: { [method: string]: boolean } = {};
};