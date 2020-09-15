#!/usr/bin/env node
import config from "./lib/entry";
import { Logger } from "logger-flx";
import { Starter } from "./lib/starter";



console.log(config);



const logger = new Logger({
    mode: "prod",
    type: true,
    timestamp: "none",
    enable: true
});

const starter = new Starter(config.exec, config.cwd, logger);




process.on("SIGTERM", () => {
    console.log("💀 Termination signal received 💀");
    starter.stop();
    setTimeout( () => {
        process.exit();
    }, 500);
});