import Chalk from "chalk";
import DotEnv from "dotenv";

import { LogColor, LogColorBright } from "./utils/Logging";

import HTTPServer from "./server";

function clog(msg: string, color: LogColor | LogColorBright = "white") {
    try {
        console.log(Chalk[color](msg));
    }
    catch {
        console.log(msg);
    }
};

function errlog(error: Error) {
    clog(error.message + error.stack, "red");
}

DotEnv.config();

process.on("uncaughtException", errlog);
process.on("unhandledRejection", errlog);

new HTTPServer(clog);