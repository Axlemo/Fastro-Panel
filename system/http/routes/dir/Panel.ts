import { DirectoryRoute, RequestContext, ViewResult } from "../../../_classes";
import { IRequestResult } from "../../../_interfaces";

export class PanelHome extends DirectoryRoute {
    constructor() {
        super({
            path: "/panel",
            directory: "pages/panel.html",
            requiresLogin: true,
        });
    }

    async onRequest(context: RequestContext): Promise<IRequestResult> {
        return new ViewResult(this.directory);
    }
};

export class PanelUpdates extends DirectoryRoute {
    constructor() {
        super({
            path: "/updates",
            directory: "pages/updates.html",
            requiresLogin: true,
        });
    }

    async onRequest(context: RequestContext): Promise<IRequestResult> {
        return new ViewResult(this.directory);
    }
};