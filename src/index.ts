#!/usr/bin/env node
import config from "./lib/entry";
import { Logger } from "logger-flx";
import { IStarterConfig, Starter } from "./lib/starter";

const logger = new Logger({
    mode: config.logs,
    type: true,
    timestamp: "none",
    enable: true
});

console.log(config);








if (config.exec !== undefined) {

    const starter_config: IStarterConfig = {
        exec: config.exec,
        cwd: config.cwd,
        restart_interval: config.restart_interval
    };

    const starter = new Starter(starter_config, logger);

    starter.on("close", () => {
        process.exit();
    });

    starter.on("error", () => {
        process.exit(1);
    });

    process.on("SIGTERM", () => {
        console.log("💀 Termination signal received 💀");
        starter.stop();
    });

}