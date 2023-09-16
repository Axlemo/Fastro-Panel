import * as Terser from "terser";

import { RequestContext } from "../../system/_classes";
import { IHttpServiceHandler } from "../../system/_interfaces";
import { ContentType } from "../../system/_types";

import HTTPServer from "../../server";
import Conf from "../../utils/Configuration";
import Utils from "../../utils/Toolbox";

export default class StaticService implements IHttpServiceHandler {
    constructor(base: HTTPServer) {
        this.base = base;
    }

    base: HTTPServer;

    cache: { [file: string]: string } = {};

    async process(context: RequestContext, url: string) {
        const path = Conf.Static.PhysicalDirectory + url.replace(Conf.Static.VirtualDirectory, "");
        let contentType!: ContentType;

        Object.keys(ContentType).forEach((item) => {
            if (path.endsWith(`.${item.toLowerCase()}`)) {
                contentType = ContentType[item as keyof typeof ContentType];
            }
        });

        try {
            if (Conf.Static.EnableClientCaching && !this.cache[path]) {
                const data = await Utils.readFile(path, ".");

                if (contentType === ContentType.JS) {
                    try {
                        const minified = await Terser.minify(data);
                        this.cache[path] = minified.code ?? data;
                    }
                    catch {
                        this.cache[path] = data;
                    }
                }
                else {
                    this.cache[path] = data;
                }
            }
            else {
                this.cache[path] = await Utils.readFile(path, ".");
            }

            if (Conf.Static.EnableClientCaching) context.header("Cache-Control", "private, max-age=86400;");

            context.contentType(contentType);

            context.end(this.cache[path]);
        }
        catch (error) {
            let e = error as Error;

            this.base._log(`Static resource exception from: ${context.requestId} -> ${e?.stack + e?.message}`, "yellow");

            this.base.renderActionFailure(context, Conf.Static.Integrated.ErrorFiles.SvrError, 500);
        }
    }
};