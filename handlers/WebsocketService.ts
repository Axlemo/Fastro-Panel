import * as WS from "ws";

import { SessionModel } from "../database/provider";

import HTTPServer from "../server";

export default class WebsocketService {
    constructor(server: WS.Server, base: HTTPServer) {
        this.server = server;
        this.base = base;
    }

    server: WS.Server;
    base: HTTPServer;

    socketAttached(ws: WS.WebSocket, session: SessionModel) {
        this.base._log(`WebSocket client attached from user: ${session.userId}`);
    }

    socketDetached(ws: WS.WebSocket) {

    }

    incomingMessage(data: string, session: SessionModel) {

    }
};